import { Entity, Column, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ComoCalendar {
  constructor(props?: Partial<ComoCalendar>) {
    Object.assign(this, props);
  }

  @PrimaryGeneratedColumn()
  id!: string;

  @Index()
  @Column("text", { nullable: false })
  contract!: string;

  @Index()
  @Column("text", { nullable: false })
  address!: string;

  @Index()
  @Column("int4", { nullable: false })
  day!: number;

  @Column("int4", { nullable: false })
  amount!: number;
}
