import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
} from "@subsquid/typeorm-store";
import * as marshal from "./marshal";

@Entity_()
export class Vote {
  constructor(props?: Partial<Vote>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @Column_("text", { nullable: false })
  from!: string;

  @Index_()
  @Column_("timestamp with time zone", { nullable: false })
  createdAt!: Date;

  @Index_()
  @Column_("text", { nullable: false })
  contract!: string;

  @Index_()
  @Column_("int4", { nullable: false })
  pollId!: number;

  @Index_()
  @Column_("int4", { nullable: true })
  candidateId!: number | undefined | null;

  @Index_()
  @Column_("int4", { nullable: true })
  index!: number;

  @Index_()
  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  amount!: bigint;
}
