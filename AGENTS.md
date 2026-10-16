# Agent Instructions & Workflow Rules

## Task Management MCP Workflow

Untuk setiap interaksi dan pengerjaan di repository **Portfolio** ini, patuhi aturan task management berikut secara otomatis dan mandiri:

1. **Target Project ID**:
   - Project ID untuk repo ini di `task-management` MCP server adalah **`10`** (**Portfolio**, color: `#6366f1`).

2. **Awal Pengerjaan (Request Fitur / Bugfix / Enhancement)**:
   - Setiap kali user meminta fitur baru, bugfix, refactor, atau enhancement:
     1. Selalu cari task aktif terlebih dahulu dengan memanggil tool MCP `list_tasks` (filter `project_id: 10`, `status: "in_progress"`).
     2. Jika belum ada task yang sesuai, otomatis buat task baru menggunakan tool MCP `create_task`:
        - `project_id`: `10`
        - `title`: Ringkas dan jelas sesuai request pekerjaan
        - `description`: Detail pengerjaan atau ruang lingkup teknis
        - `status`: `"in_progress"`
        - `subtasks`: Rincian checklist langkah implementasi
        - `is_focus`: `true`

3. **Penyelesaian Pengerjaan (Verifikasi & Commit/Push)**:
   - Setelah pekerjaan selesai diimplementasikan, diverifikasi, dan di-commit/push:
     1. Otomatis update task dan subtask menjadi `"done"` dengan memanggil tool MCP `log_task_progress`:
        - `task_id`: ID task terkait
        - `completed_subtask_ids`: Array ID subtask yang telah selesai
        - `progress_note`: Rangkuman hasil pengerjaan dan status commit/push
        - `status`: `"done"`

4. **Eksekusi Mandiri**:
   - Jalankan siklus task management ini secara mandiri (autonomous) di setiap tugas tanpa perlu menunggu instruksi atau diingatkan oleh user.
