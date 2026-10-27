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

## API Endpoint Validation Standard (Zod & H3 Validation Rules)

Setiap pembuatan atau modifikasi endpoint API di `server/api/` (GET, POST, PUT, DELETE, PATCH) **WAJIB** mengikuti aturan validasi standar repository ini:

1. **Definisi Model & Schema di `server/model/`**:
   - Seluruh Zod schema untuk request body, query parameters, atau data transfer objects harus didefinisikan di direktori `server/model/*.model.ts`.
   - Selalu export inferred TypeScript types (misal: `export type MyInput = z.infer<typeof mySchema>;`).

2. **Validasi Request Body (POST / PUT / PATCH)**:
   - Gunakan `readValidatedBody` dari H3 dengan `safeParse`:
     ```ts
     import z from "zod";
     import { HttpError } from "~~/server/errors/HttpError";
     import { mySchema } from "~~/server/model/my.model";

     export default withAuth(async (event) => {
       const parsed = await readValidatedBody(event, (body) => mySchema.safeParse(body));

       if (!parsed.success) {
         throw new HttpError(
           400,
           "VALIDATION_ERROR",
           "Invalid request data",
           z.treeifyError(parsed.error).properties
         );
       }

       const data = parsed.data;
       // ... Lanjutkan proses
     });
     ```

3. **Validasi Query Parameters (GET)**:
   - Gunakan `getValidatedQuery` dari H3 dengan `safeParse`:
     ```ts
     const parsed = await getValidatedQuery(event, (query) => myQuerySchema.safeParse(query));

     if (!parsed.success) {
       throw new HttpError(
         400,
         "VALIDATION_ERROR",
         "Invalid query parameters",
         z.treeifyError(parsed.error).properties
       );
     }

     const query = parsed.data;
     ```

4. **Validasi Route Parameters ([id], [slug], dsb)**:
   - Ambil parameter dengan `getRouterParam(event, 'id')` dan validasi menggunakan Zod schema atau `.refine()`:
     ```ts
     const ok = z.coerce.number().positive().safeParse(getRouterParam(event, 'id'));
     if (!ok.success) {
       throw new HttpError(400, 'INVALID_ID', 'The provided ID is not a valid number.');
     }
     ```

5. **Dilarang Manual Ad-Hoc Validation**:
   - Dilarang keras melakukan pengecekan manual mentah seperti `if (!body?.field1 || !body?.field2)` tanpa schema Zod.
   - Format error validasi wajib melempar `HttpError` dengan status `400`, code `'VALIDATION_ERROR'`, dan properties dari `z.treeifyError(parsed.error).properties`.

