-- Backfill the organized Boss Workspace folders for existing workspaces.
-- Preserve existing file contents and seed each layout file only once.
INSERT INTO boss_workspace_files (workspace_id, path, content, updated_at)
SELECT workspace.id, seed.path, seed.content, now()
FROM boss_workspaces AS workspace
CROSS JOIN (
  VALUES
    (
      'knowledge/README.md',
      $knowledge$# Knowledge

เก็บข้อมูลอ้างอิงที่ใช้ซ้ำได้ แยกเป็นไฟล์ตามหัวข้อ และระบุแหล่งที่มาหรือวันที่ตรวจสอบเมื่อเหมาะสม
$knowledge$
    ),
    (
      'skills/README.md',
      $skills$# Skills

เก็บขั้นตอนการทำงานที่นำกลับมาใช้ซ้ำได้ แนะนำให้แยกเป็น skills/<ชื่อสกิล>/SKILL.md พร้อมเงื่อนไขการใช้และขั้นตอนตรวจสอบ
$skills$
    ),
    (
      'tasks/README.md',
      $tasks$# Tasks

เก็บแผนและบันทึกงานที่ต้องติดตาม แนะนำให้แยกหนึ่งไฟล์ต่อเป้าหมาย พร้อมสถานะ ขั้นตอนถัดไป และหลักฐานผลลัพธ์
$tasks$
    ),
    (
      'project/README.md',
      $project$# Project

พื้นที่ทำงานที่ซิงก์กับ Sandbox Runner
- source files: project/src/
- package configuration: project/package.json
- tests: project/tests/
- generated files: project/generated/

เก็บไฟล์โปรเจกต์ทั้งหมดไว้ใต้ project/ และอย่าใส่ secret หรือ credential
$project$
    ),
    (
      'project/package.json',
      $package${
  "name": "boss-workspace-project",
  "private": true,
  "version": "0.0.0"
}
$package$
    ),
    ('project/src/.gitkeep', ''),
    ('project/tests/.gitkeep', ''),
    ('project/generated/.gitkeep', '')
) AS seed(path, content)
ON CONFLICT (workspace_id, path) DO NOTHING;
