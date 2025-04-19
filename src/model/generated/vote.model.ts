import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import * as marshal from "./marshal";

@Entity()
export class Vote {
  constructor(props?: Partial<Vote>) {
    Object.assign(this, props);
  }

  @PrimaryColumn({
    type: "uuid",
  })
  id!: string;

  @Index()
  @Column("text", { nullable: false })
  from!: string;

  @Index()
  @Column("timestamp with time zone", { nullable: false })
  createdAt!: Date;

  @Index()
  @Column("text", { nullable: false })
  contract!: string;

  @Index()
  @Column("int4", { nullable: false })
  pollId!: number;

  @Index()
  @Column("int4", { nullable: true })
  candidateId!: number | undefined | null;

  @Index()
  @Column("int4", { nullable: true })
  index!: number;

  @Index()
  @Column("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  amount!: bigint;
}
