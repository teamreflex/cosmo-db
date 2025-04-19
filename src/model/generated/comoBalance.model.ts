import { Entity, Column, PrimaryColumn, Index } from "typeorm";
import * as marshal from "./marshal";

@Entity()
export class ComoBalance {
  constructor(props?: Partial<ComoBalance>) {
    Object.assign(this, props);
  }

  @PrimaryColumn({
    type: "uuid",
  })
  id!: string;

  @Index()
  @Column("text", { nullable: false })
  contract!: string;

  @Index()
  @Column("text", { nullable: false })
  owner!: string;

  @Index()
  @Column("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  amount!: bigint;
}
