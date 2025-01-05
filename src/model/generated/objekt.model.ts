import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
  OneToMany as OneToMany_,
  ManyToOne as ManyToOne_,
} from "@subsquid/typeorm-store";
import { Transfer } from "./transfer.model";
import { Collection } from "./collection.model";

@Entity_()
export class Objekt {
  constructor(props?: Partial<Objekt>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @Column_("text", { nullable: false })
  owner!: string;

  @Column_("timestamp with time zone", { nullable: false })
  mintedAt!: Date;

  @Index_()
  @Column_("timestamp with time zone", { nullable: false })
  receivedAt!: Date;

  @Index_()
  @Column_("int4", { nullable: false })
  serial!: number;

  @Index_()
  @Column_("boolean", { nullable: false })
  transferable!: boolean;

  @OneToMany_(() => Transfer, (e) => e.objekt)
  transfers!: Transfer[];

  @Index_()
  @ManyToOne_(() => Collection, { nullable: true })
  collection!: Collection;
}
