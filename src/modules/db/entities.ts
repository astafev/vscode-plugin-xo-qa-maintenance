import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, PrimaryColumn } from "typeorm";

@Entity()
export class CiRun extends BaseEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column('integer')
    startTime?: number;

    @Column('integer')
    duration?: number;

    @Column('text')
    result?: string;

    @Column('text')
    suite?: string;
}

@Entity()
export class TestCase extends BaseEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column('text')
    title?: string;

    @Column('text')
    file?: string;

    @Column('integer')
    line?: number;
}

@Entity()
export class TestResult extends BaseEntity {
    @PrimaryGeneratedColumn()
    uid?: string;

    @Column('integer')
    ciRunId?: number;

    @Column('integer')
    testCaseId?: number;

    @Column('text')
    result?: string;

    @Column('text')
    console?: string;

    @Column('text')
    comment?: string;
}