import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
  ManyToOne as ManyToOne_,
} from "typeorm";
import { Objekt } from "./objekt.model";

@Entity_()
export class Transfer {
  constructor(props?: Partial<Transfer>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @Column_("text", { nullable: false })
  from!: string;

  @Index_()
  @Column_("text", { nullable: false })
  to!: string;

  @Column_("timestamp", { nullable: false })
  timestamp!: Date;

  @Column_("text", { nullable: false })
  tokenId!: string;

  @Index_()
  @ManyToOne_(() => Objekt, { nullable: true })
  objekt!: Objekt;
}
