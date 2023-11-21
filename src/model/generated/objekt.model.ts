import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
  OneToMany as OneToMany_,
} from "typeorm";
import { Transfer } from "./transfer.model";

@Entity_()
export class Objekt {
  constructor(props?: Partial<Objekt>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @Column_("text", { nullable: false })
  contract!: string;

  @Column_("timestamp", { nullable: false })
  timestamp!: Date;

  @Index_({ unique: true })
  @Column_("text", { nullable: false })
  collectionId!: string;

  @Index_()
  @Column_("text", { nullable: false })
  season!: string;

  @Index_()
  @Column_("text", { nullable: false })
  member!: string;

  @Index_()
  @Column_("text", { nullable: false })
  artist!: string;

  @Index_()
  @Column_("text", { nullable: false })
  collectionNo!: string;

  @Index_()
  @Column_("text", { nullable: false })
  class!: string;

  @Column_("text", { nullable: false })
  frontImage!: string;

  @Column_("text", { nullable: false })
  backImage!: string;

  @Column_("text", { nullable: false })
  backgroundColor!: string;

  @Column_("text", { nullable: false })
  textColor!: string;

  @Column_("int4", { nullable: false })
  comoAmount!: number;

  @Index_()
  @Column_("text", { nullable: false })
  onOffline!: string;

  @OneToMany_(() => Transfer, (e) => e.objekt)
  transfers!: Transfer[];
}
