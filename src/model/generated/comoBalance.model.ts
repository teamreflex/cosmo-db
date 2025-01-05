import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
} from "@subsquid/typeorm-store";
import * as marshal from "./marshal";

@Entity_()
export class ComoBalance {
  constructor(props?: Partial<ComoBalance>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @Column_("text", { nullable: false })
  contract!: string;

  @Index_()
  @Column_("text", { nullable: false })
  owner!: string;

  @Index_()
  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  amount!: bigint;
}
