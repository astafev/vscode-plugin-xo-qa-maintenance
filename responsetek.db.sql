BEGIN TRANSACTION;
DROP TABLE IF EXISTS "test_result";
CREATE TABLE IF NOT EXISTS "test_result" (
	"uid"	TEXT NOT NULL UNIQUE,
	"ci_run_id"	INTEGER,
	"test_case_id"	INTEGER,
	"result"	TEXT,
	"console"	TEXT,
	"user_comment"	TEXT,
	PRIMARY KEY("uid")
);
DROP TABLE IF EXISTS "screenshots";
CREATE TABLE IF NOT EXISTS "screenshots" (
	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	"uid"	TEXT,
	"screenshot"	BLOB
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
DROP TABLE IF EXISTS "test_case";
CREATE TABLE IF NOT EXISTS "test_case" (
	"id"	INTEGER NOT NULL UNIQUE,
	"title"	TEXT,
	"file"	TEXT,
	"line"	INTEGER,
	PRIMARY KEY("id")
);
COMMIT;
