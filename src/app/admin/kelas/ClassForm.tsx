"use client";

type Teacher = { id: number; nama: string };

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  teachers: Teacher[];
  values?: { id?: number; nama_kelas: string; guru_id: string };
  mode?: "create" | "edit";
};

export function ClassForm({ action, teachers, values, mode = "create" }: Props) {
  return (
    <form action={action} className="card card-pad-lg h-fit">
      {mode === "edit" && values?.id ? (
        <input type="hidden" name="id" value={values.id} />
      ) : null}

      <h2 className="section-title mb-4">
        {mode === "edit" ? "Ubah kelas" : "Tambah kelas"}
      </h2>

      <div className="grid gap-3.5">
        <label className="field">
          <span className="field-label">Nama kelas</span>
          <input
            name="nama_kelas"
            defaultValue={values?.nama_kelas ?? ""}
            required
            maxLength={20}
            placeholder="Contoh: 1 A"
            className="input uppercase"
          />
          <span className="field-hint">Gunakan format tingkat + huruf, mis. 1 A, 4 D.</span>
        </label>
        <label className="field">
          <span className="field-label">Wali kelas</span>
          <select name="guru_id" defaultValue={values?.guru_id ?? ""} className="select">
            <option value="">— Belum ditentukan —</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.nama}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary btn-md btn-block mt-1">
          {mode === "edit" ? "Simpan perubahan" : "Tambah kelas"}
        </button>
      </div>
    </form>
  );
}
