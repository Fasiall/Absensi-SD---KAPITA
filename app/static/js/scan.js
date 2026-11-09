(function () {
  "use strict";

  const page = document.getElementById("scan-page");
  if (!page) {
    return;
  }

  const csrfToken =
    (document.querySelector('meta[name="csrf-token"]') || {}).content || "";
  const classId = Number(page.dataset.classId);
  const userId = page.dataset.userId || "anon";
  const tanggal = page.dataset.tanggal;
  const totalStudents = Number(page.dataset.studentCount) || 0;
  const PENDING_KEY = "absensi_pending_v1_" + userId;

  let counts = {};
  try {
    counts = JSON.parse(page.dataset.counts || "{}");
  } catch (error) {
    counts = {};
  }

  const readerEl = document.getElementById("reader");
  const overlay = document.getElementById("camera-overlay");
  const cameraMessage = document.getElementById("camera-message");
  const cameraStart = document.getElementById("camera-start");
  const cameraToggle = document.getElementById("camera-toggle");
  const cameraToggleText = document.getElementById("camera-toggle-text");
  const cameraStatus = document.getElementById("camera-status");
  const offlineBanner = document.getElementById("offline-banner");
  const pendingText = document.getElementById("pending-text");
  const syncButton = document.getElementById("sync-button");
  const flashEl = document.getElementById("scan-flash");
  const flashIcon = document.getElementById("flash-icon");
  const flashLabel = document.getElementById("flash-label");
  const flashName = document.getElementById("flash-name");
  const flashMessage = document.getElementById("flash-message");
  const dialog = document.getElementById("status-dialog");
  const dialogName = document.getElementById("dialog-name");
  const noteInput = document.getElementById("status-note");
  const statusError = document.getElementById("status-error");

  let scanner = null;
  let isScanning = false;
  let isStarting = false;
  let cooldown = false;
  let activeFilter = "all";
  let currentStudentId = null;
  let audioContext = null;
  let flashTimer = null;

  const FLASH_ICONS = {
    success:
      '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    warning:
      '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>',
    danger:
      '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  };

  function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function renderCounts() {
    const total = formatNumber(counts.total || totalStudents);
    const hadir = formatNumber(counts.Hadir);
    const percent = total ? (hadir / total) * 100 : 0;

    const hadirEl = document.getElementById("count-hadir");
    const totalEl = document.getElementById("count-total");
    const percentEl = document.getElementById("count-percent");
    const barEl = document.getElementById("count-bar");

    if (hadirEl) {
      hadirEl.textContent = hadir;
    }
    if (totalEl) {
      totalEl.textContent = total;
    }
    if (percentEl) {
      percentEl.textContent = Math.round(percent) + "%";
    }
    if (barEl) {
      barEl.style.width = percent.toFixed(1) + "%";
    }

    const mapping = {
      "count-sakit": counts.Sakit,
      "count-izin": counts.Izin,
      "count-alpa": counts.Alpa,
      "count-belum": counts.Belum,
    };
    Object.keys(mapping).forEach(function (id) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = formatNumber(mapping[id]);
      }
    });
  }

  function setCounts(next) {
    if (!next) {
      return;
    }
    counts = Object.assign({}, counts, next);
    renderCounts();
  }

  function updateRow(student, status, pending, catatan) {
    if (!student || !student.id) {
      return;
    }
    const row = document.querySelector(
      '.student-row[data-student-id="' + Number(student.id) + '"]'
    );
    if (!row) {
      return;
    }

    row.dataset.status = status;

    const badge = row.querySelector("[data-status-badge]");
    if (badge) {
      badge.textContent = pending ? "Menunggu" : status;
      badge.className =
        "badge badge-" + (pending ? "belum" : String(status).toLowerCase());
    }

    const openButton = row.querySelector("[data-open-status]");
    if (openButton) {
      openButton.dataset.status = status;
      openButton.dataset.catatan = catatan || "";
    }

    row.classList.toggle("is-pending", Boolean(pending));

    const info = row.querySelector(".student-info");
    let note = row.querySelector(".student-note");
    if (info) {
      if (catatan) {
        if (!note) {
          note = document.createElement("small");
          note.className = "student-note";
          info.appendChild(note);
        }
        note.textContent = catatan;
      } else if (note) {
        note.remove();
      }
    }
  }

  function applyListFilter() {
    document.querySelectorAll(".student-row").forEach(function (row) {
      row.hidden = activeFilter !== "all" && row.dataset.status !== activeFilter;
    });
  }

  document.querySelectorAll("[data-list-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.listFilter || "all";
      document.querySelectorAll("[data-list-filter]").forEach(function (item) {
        item.classList.toggle("active", item === button);
      });
      applyListFilter();
    });
  });

  function setCameraStatus(text, tone) {
    if (!cameraStatus) {
      return;
    }
    cameraStatus.textContent = text;
    cameraStatus.classList.toggle("is-off", tone === "off");
    cameraStatus.classList.toggle("is-error", tone === "error");
  }

  function showOverlay(message) {
    if (!overlay) {
      return;
    }
    overlay.classList.remove("is-hidden");
    if (cameraMessage && message) {
      cameraMessage.textContent = message;
    }
  }

  function hideOverlay() {
    if (overlay) {
      overlay.classList.add("is-hidden");
    }
  }

  function showFlash(type, label, name, message, duration) {
    if (!flashEl) {
      return;
    }
    flashEl.hidden = false;
    flashEl.className = "scan-flash " + type;
    if (flashIcon) {
      flashIcon.innerHTML = FLASH_ICONS[type] || FLASH_ICONS.success;
    }
    if (flashLabel) {
      flashLabel.textContent = label;
    }
    if (flashName) {
      flashName.textContent = name || "";
    }
    if (flashMessage) {
      flashMessage.textContent = message || "";
    }

    window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(function () {
      flashEl.hidden = true;
    }, duration || 2200);
  }

  if (flashEl) {
    flashEl.addEventListener("click", function () {
      flashEl.hidden = true;
      window.clearTimeout(flashTimer);
    });
  }

  function unlockAudio() {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) {
        return;
      }
      if (!audioContext) {
        audioContext = new AudioCtor();
      }
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
    } catch (error) {
      /* audio opsional */
    }
  }

  function beep() {
    if (!audioContext) {
      return;
    }
    try {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (error) {
      /* audio opsional */
    }
  }

  function vibrate(pattern) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        /* getaran opsional */
      }
    }
  }

  function getQueue() {
    try {
      const value = JSON.parse(window.localStorage.getItem(PENDING_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function setQueue(queue) {
    try {
      window.localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
    } catch (error) {
      /* penyimpanan penuh atau diblokir */
    }
    updateOfflineBanner();
  }

  function queueItem(item) {
    const queue = getQueue();
    const exists = queue.some(function (entry) {
      return (
        entry.qr === item.qr &&
        Number(entry.class_id) === Number(item.class_id) &&
        entry.tanggal === item.tanggal
      );
    });
    if (!exists) {
      queue.push(item);
      setQueue(queue);
    }
  }

  function removeQueued(qr) {
    const queue = getQueue();
    const filtered = queue.filter(function (entry) {
      return !(
        entry.qr === qr &&
        Number(entry.class_id) === classId &&
        entry.tanggal === tanggal
      );
    });
    if (filtered.length !== queue.length) {
      setQueue(filtered);
    }
  }

  function updateOfflineBanner() {
    if (!offlineBanner) {
      return;
    }
    const queue = getQueue();
    const offline = !navigator.onLine;

    if (!queue.length && !offline) {
      offlineBanner.hidden = true;
      return;
    }

    offlineBanner.hidden = false;
    if (pendingText) {
      if (queue.length) {
        pendingText.textContent =
          queue.length + " absensi menunggu sinkron.";
      } else {
        pendingText.textContent = "Koneksi terputus.";
      }
    }
    if (syncButton) {
      syncButton.disabled = queue.length === 0;
      syncButton.textContent = queue.length ? "Sinkronkan" : "Menunggu online";
    }
  }

  async function postJSON(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(payload),
    });
    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }
    return data;
  }

  function pauseScanner(milliseconds) {
    if (scanner && isScanning) {
      try {
        scanner.pause(true);
      } catch (error) {
        /* scanner mungkin sudah berhenti */
      }
    }
    window.setTimeout(function () {
      cooldown = false;
      if (scanner && isScanning) {
        try {
          scanner.resume();
        } catch (error) {
          /* scanner mungkin sudah berhenti */
        }
      }
    }, milliseconds);
  }

  function handleResult(data) {
    if (data.counts) {
      setCounts(data.counts);
    }

    if (data.ok && data.student) {
      beep();
      vibrate(120);
      updateRow(data.student, data.student.status, false, data.student.catatan);
      showFlash(
        "success",
        "Absensi berhasil",
        data.student.nama,
        data.message,
        1800
      );
      applyListFilter();
      pauseScanner(1400);
      return;
    }

    if (data.code === "duplicate" && data.student) {
      vibrate([80, 60, 80]);
      updateRow(data.student, data.student.status, false, data.student.catatan);
      showFlash(
        "warning",
        "Sudah tercatat",
        data.student.nama,
        data.message,
        2400
      );
      applyListFilter();
      pauseScanner(1900);
      return;
    }

    vibrate([120, 60, 120]);
    showFlash(
      "danger",
      "QR tidak dapat diproses",
      data.student ? data.student.nama : "Coba lagi",
      data.message || "Terjadi kesalahan saat memproses QR.",
      2800
    );
    pauseScanner(2000);
  }

  function handleOfflineScan(qr) {
    const row = document.querySelector('.student-row[data-qr="' + qr + '"]');
    if (!row) {
      vibrate([120, 60, 120]);
      showFlash(
        "danger",
        "QR tidak dikenali",
        "Kartu tidak cocok",
        "QR ini bukan milik siswa di kelas yang dipilih.",
        2600
      );
      pauseScanner(1900);
      return;
    }

    const status = row.dataset.status;
    const studentId = Number(row.dataset.studentId);
    const nameEl = row.querySelector(".student-info strong");
    const name = nameEl ? nameEl.textContent : "Siswa";

    if (status !== "Belum") {
      vibrate([80, 60, 80]);
      showFlash(
        "warning",
        "Sudah tercatat",
        name,
        "Siswa ini sudah tercatat " + status + " hari ini.",
        2200
      );
      pauseScanner(1900);
      return;
    }

    queueItem({
      qr: qr,
      class_id: classId,
      tanggal: tanggal,
      student_id: studentId,
      nama: name,
      ts: Date.now(),
    });

    updateRow({ id: studentId }, "Hadir", true, null);
    counts.Hadir = formatNumber(counts.Hadir) + 1;
    counts.Belum = Math.max(0, formatNumber(counts.Belum) - 1);
    renderCounts();
    applyListFilter();

    beep();
    vibrate(120);
    showFlash(
      "warning",
      "Tersimpan di perangkat",
      name,
      "Koneksi terputus. Absensi akan dikirim otomatis saat online.",
      2600
    );
    pauseScanner(1900);
  }

  async function processScan(qr) {
    if (!navigator.onLine) {
      handleOfflineScan(qr);
      return;
    }

    let data = null;
    try {
      data = await postJSON("/guru/api/scan", {
        qr: qr,
        class_id: classId,
        tanggal: tanggal,
      });
    } catch (error) {
      handleOfflineScan(qr);
      return;
    }

    if (!data) {
      showFlash(
        "danger",
        "Server bermasalah",
        "Coba lagi",
        "Server tidak memberi respons yang valid. Periksa koneksi lalu coba lagi.",
        2800
      );
      pauseScanner(2000);
      return;
    }

    if (data.ok) {
      removeQueued(qr);
    }
    handleResult(data);
  }

  function onScanSuccess(decodedText) {
    if (cooldown || !isScanning) {
      return;
    }
    cooldown = true;
    processScan(decodedText);
  }

  function onScanFailure() {
    /* Kegagalan pembacaan per frame adalah hal biasa; abaikan. */
  }

  function cameraErrorMessage(error) {
    const text = String((error && error.message) || error || "");
    if (/NotAllowed|Permission|denied/i.test(text)) {
      return "Akses kamera ditolak. Izinkan kamera di pengaturan browser, lalu muat ulang halaman.";
    }
    if (/NotFound|DevicesNotFound|no camera/i.test(text)) {
      return "Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.";
    }
    if (/NotReadable|TrackStart|Could not start video/i.test(text)) {
      return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.";
    }
    if (/secure|https/i.test(text)) {
      return "Kamera hanya bisa dipakai lewat HTTPS atau localhost.";
    }
    return "Kamera tidak dapat dinyalakan. Pastikan situs dibuka lewat HTTPS atau localhost dan izin kamera diberikan.";
  }

  async function startCamera() {
    if (isScanning || isStarting) {
      return;
    }
    unlockAudio();

    if (!window.Html5Qrcode) {
      showOverlay(
        "Pustaka kamera gagal dimuat. Periksa koneksi internet lalu muat ulang halaman."
      );
      setCameraStatus("Kamera tidak tersedia", "error");
      return;
    }

    if (!window.isSecureContext) {
      showOverlay(
        "Kamera hanya bisa dipakai lewat HTTPS atau localhost. Buka aplikasi melalui alamat yang aman."
      );
      setCameraStatus("Butuh HTTPS", "error");
      return;
    }

    isStarting = true;
    if (cameraStart) {
      cameraStart.disabled = true;
    }
    setCameraStatus("Menyiapkan kamera", "off");
    showOverlay("Izinkan akses kamera bila browser meminta.");

    if (!scanner) {
      scanner = new window.Html5Qrcode("reader", { verbose: false });
    }

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.333,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        onScanSuccess,
        onScanFailure
      );

      isScanning = true;
      hideOverlay();
      setCameraStatus("Kamera aktif", "on");
      if (cameraToggle) {
        cameraToggle.disabled = false;
      }
      if (cameraToggleText) {
        cameraToggleText.textContent = "Matikan Kamera";
      }
      if (cameraStart) {
        cameraStart.disabled = false;
      }
    } catch (error) {
      isScanning = false;
      showOverlay(cameraErrorMessage(error));
      setCameraStatus("Kamera gagal", "error");
      if (cameraStart) {
        cameraStart.disabled = false;
      }
      if (cameraToggle) {
        cameraToggle.disabled = true;
      }
    } finally {
      isStarting = false;
    }
  }

  async function stopCamera() {
    if (!scanner) {
      return;
    }
    try {
      if (isScanning) {
        await scanner.stop();
      }
    } catch (error) {
      /* abaikan */
    }
    try {
      scanner.clear();
    } catch (error) {
      /* abaikan */
    }
    scanner = null;
    isScanning = false;
    cooldown = false;
    if (readerEl) {
      readerEl.innerHTML = "";
    }
    setCameraStatus("Kamera mati", "off");
    showOverlay("Kamera dimatikan. Tekan Nyalakan Kamera untuk memindai lagi.");
    if (cameraToggleText) {
      cameraToggleText.textContent = "Nyalakan Kamera";
    }
    if (cameraToggle) {
      cameraToggle.disabled = false;
    }
    if (cameraStart) {
      cameraStart.disabled = false;
    }
  }

  if (cameraStart) {
    cameraStart.addEventListener("click", startCamera);
  }

  if (cameraToggle) {
    cameraToggle.addEventListener("click", function () {
      if (isScanning) {
        stopCamera();
      } else {
        startCamera();
      }
    });
  }

  function openStatusDialog(button) {
    currentStudentId = Number(button.dataset.studentId);
    if (dialogName) {
      dialogName.textContent = button.dataset.studentName || "Nama Siswa";
    }
    if (noteInput) {
      noteInput.value = button.dataset.catatan || "";
    }
    if (statusError) {
      statusError.hidden = true;
      statusError.textContent = "";
    }
    if (dialog && typeof dialog.showModal === "function") {
      dialog.showModal();
    } else if (dialog) {
      dialog.setAttribute("open", "");
    }
  }

  function closeStatusDialog() {
    if (!dialog) {
      return;
    }
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    currentStudentId = null;
  }

  document.querySelectorAll("[data-open-status]").forEach(function (button) {
    button.addEventListener("click", function () {
      openStatusDialog(button);
    });
  });

  document.querySelectorAll("[data-close-dialog]").forEach(function (button) {
    button.addEventListener("click", closeStatusDialog);
  });

  if (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        closeStatusDialog();
      }
    });
  }

  async function saveStatus(status) {
    if (!currentStudentId) {
      return;
    }
    if (!navigator.onLine) {
      if (statusError) {
        statusError.textContent =
          "Koneksi terputus. Ubah status membutuhkan internet.";
        statusError.hidden = false;
      }
      return;
    }

    const buttons = document.querySelectorAll("[data-status-choice]");
    buttons.forEach(function (button) {
      button.disabled = true;
    });
    if (statusError) {
      statusError.hidden = true;
    }

    let data = null;
    try {
      data = await postJSON("/guru/api/status", {
        student_id: currentStudentId,
        class_id: classId,
        tanggal: tanggal,
        status: status,
        catatan: noteInput ? noteInput.value.trim() : "",
      });
    } catch (error) {
      data = null;
    }

    buttons.forEach(function (button) {
      button.disabled = false;
    });

    if (!data) {
      if (statusError) {
        statusError.textContent =
          "Gagal menyimpan. Periksa koneksi lalu coba lagi.";
        statusError.hidden = false;
      }
      return;
    }

    if (!data.ok) {
      if (statusError) {
        statusError.textContent = data.message || "Status gagal disimpan.";
        statusError.hidden = false;
      }
      return;
    }

    if (data.counts) {
      setCounts(data.counts);
    }
    if (data.student) {
      updateRow(
        data.student,
        data.student.status,
        false,
        data.student.catatan
      );
    }
    applyListFilter();
    closeStatusDialog();

    if (status === "Hadir") {
      beep();
      vibrate(80);
    }
    showFlash(
      status === "Hadir" ? "success" : "warning",
      "Status diperbarui",
      data.student ? data.student.nama : "Siswa",
      data.message,
      2000
    );
  }

  document.querySelectorAll("[data-status-choice]").forEach(function (button) {
    button.addEventListener("click", function () {
      saveStatus(button.dataset.statusChoice);
    });
  });

  async function syncQueue(manual) {
    const queue = getQueue();
    if (!queue.length) {
      updateOfflineBanner();
      return;
    }
    if (!navigator.onLine) {
      if (manual) {
        showFlash(
          "warning",
          "Masih offline",
          "Koneksi belum tersedia",
          "Sambungkan internet lalu tekan Sinkronkan lagi.",
          2400
        );
      }
      updateOfflineBanner();
      return;
    }

    if (syncButton) {
      syncButton.disabled = true;
      syncButton.textContent = "Menyinkronkan...";
    }

    let data = null;
    try {
      data = await postJSON("/guru/api/sync", {
        items: queue.map(function (entry) {
          return {
            qr: entry.qr,
            class_id: entry.class_id,
            tanggal: entry.tanggal,
          };
        }),
      });
    } catch (error) {
      data = null;
    }

    if (!data) {
      updateOfflineBanner();
      showFlash(
        "danger",
        "Sinkron gagal",
        "Coba lagi",
        "Data masih tersimpan di perangkat. Periksa koneksi lalu tekan Sinkronkan.",
        2800
      );
      return;
    }

    if (!data.ok) {
      updateOfflineBanner();
      showFlash(
        "danger",
        "Sinkron ditolak",
        "Coba lagi",
        data.message || "Server menolak data sinkron.",
        2600
      );
      return;
    }

    const results = Array.isArray(data.results) ? data.results : [];
    const success = results.filter(function (item) {
      return item.ok;
    }).length;
    const duplicate = results.filter(function (item) {
      return !item.ok && item.code === "duplicate";
    }).length;
    const failed = results.length - success - duplicate;

    setQueue([]);
    showFlash(
      failed ? "warning" : "success",
      "Sinkron selesai",
      success + " absensi tersimpan",
      duplicate
        ? duplicate + " data sudah tercatat sebelumnya."
        : failed
          ? failed + " data ditolak server."
          : "Semua data berhasil dikirim ke server.",
      3000
    );

    window.setTimeout(function () {
      window.location.reload();
    }, 1800);
  }

  if (syncButton) {
    syncButton.addEventListener("click", function () {
      syncQueue(true);
    });
  }

  window.addEventListener("online", function () {
    updateOfflineBanner();
    if (getQueue().length) {
      syncQueue(false);
    }
  });

  window.addEventListener("offline", updateOfflineBanner);

  document.addEventListener("pointerdown", unlockAudio, { once: true });

  renderCounts();
  updateOfflineBanner();

  if (navigator.onLine && getQueue().length) {
    window.setTimeout(function () {
      syncQueue(false);
    }, 900);
  }

  window.addEventListener("load", function () {
    window.setTimeout(startCamera, 350);
  });
})();
