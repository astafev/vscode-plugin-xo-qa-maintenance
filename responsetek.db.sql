BEGIN TRANSACTION;
DROP TABLE IF EXISTS "attachments";
CREATE TABLE IF NOT EXISTS "attachments" (
	"uid"	TEXT NOT NULL,
	"name"	TEXT,
	"type"	TEXT,
	"source"	TEXT NOT NULL,
	"size"	INTEGER,
	"test_result_uid"	TEXT,
	PRIMARY KEY("uid"),
	FOREIGN KEY("test_result_uid") REFERENCES "test_result"("uid") ON DELETE CASCADE
);
DROP TABLE IF EXISTS "test_result";
CREATE TABLE IF NOT EXISTS "test_result" (
	"uid"	TEXT NOT NULL UNIQUE,
	"ci_run_id"	INTEGER NOT NULL,
	"test_case_id"	INTEGER,
	"result"	TEXT,
	"console"	TEXT,
	"user_comment"	TEXT,
	"start_time"	INTEGER,
	"duration"	INTEGER,
	"status_message"	TEXT,
	"status_trace"	TEXT,
	PRIMARY KEY("uid"),
	FOREIGN KEY("ci_run_id") REFERENCES "ci_run"("id") ON DELETE CASCADE,
	FOREIGN KEY("test_case_id") REFERENCES "test_case"("id") ON DELETE CASCADE
);
DROP TABLE IF EXISTS "test_case";
CREATE TABLE IF NOT EXISTS "test_case" (
	"id"	INTEGER NOT NULL UNIQUE,
	"title"	TEXT,
	"file"	TEXT,
	"line"	INTEGER,
	"comment"	TEXT,
	PRIMARY KEY("id")
);
DROP TABLE IF EXISTS "ci_run";
CREATE TABLE IF NOT EXISTS "ci_run" (
	"id"	INTEGER NOT NULL UNIQUE,
	"start_time"	INTEGER,
	"duration"	INTEGER,
	"result"	TEXT,
	"suite"	TEXT,
	"console"	TEXT,
	"branch"	TEXT,
	"revision"	TEXT,
	PRIMARY KEY("id")
);
COMMIT;
