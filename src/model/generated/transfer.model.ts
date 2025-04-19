import { Entity, Column, PrimaryColumn, Index, ManyToOne } from "typeorm";
import { Objekt } from "./objekt.model";
import { Collection } from "./collection.model";

@Entity()
export class Transfer {
  constructor(props?: Partial<Transfer>) {
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
  @Column("text", { nullable: false })
  to!: string;

  @Column("timestamp with time zone", { nullable: false })
  timestamp!: Date;

  @Column("text", { nullable: false })
  tokenId!: string;

  @Column("text", { nullable: false })
  hash!: string;

  @Index()
  @ManyToOne(() => Objekt, { nullable: true })
  objekt!: Objekt;

  @Index()
  @ManyToOne(() => Collection, { nullable: true })
  collection!: Collection;
}
