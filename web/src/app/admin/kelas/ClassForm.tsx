"use client";

type Teacher = { id: number; nama: string };

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  teachers: Teacher[];
  values?: { nama_kelas: string; guru_id: string };
  mode?: "create" | "edit";
};

export function ClassForm({ action, teachers, values, mode = "create" }: Props) {
  return (
    <form
      action={action}
      className="h-fit rounded-2xl border border-line bg-surface p-5 shadow-sm"
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
        {mode === "edit" ? "Ubah kelas" : "Tambah kelas"}
      </h2>

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Nama kelas</span>
          <input
            name="nama_kelas"
            defaultValue={values?.nama_kelas ?? ""}
            required
            maxLength={20}
            placeholder="Contoh: 1A"
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm uppercase outline-none focus:border-accent"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Wali kelas</span>
          <select
            name="guru_id"
            defaultValue={values?.guru_id ?? ""}
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-accent"
          >
            <option value="">— Belum ditentukan —</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.nama}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-11 rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          {mode === "edit" ? "Simpan perubahan" : "Tambah kelas"}
        </button>
      </div>
    </form>
  );
}
