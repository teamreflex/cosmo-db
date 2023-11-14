import { Entity, Column, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Objekt {
  constructor(props?: Partial<Objekt>) {
    Object.assign(this, props);
  }

  @PrimaryGeneratedColumn()
  id!: string;

  @Index()
  @Column("text", { nullable: false })
  contract!: string;

  @Column("bigint", { nullable: false })
  timestamp!: BigInt;

  @Index()
  @Column("text", { nullable: false })
  collectionId!: string;

  @Index()
  @Column("text", { nullable: false })
  season!: string;

  @Index()
  @Column("text", { nullable: false })
  member!: string;

  @Index()
  @Column("text", { nullable: false })
  artist!: string;

  @Index()
  @Column("text", { nullable: false })
  collectionNo!: string;

  @Index()
  @Column("text", { nullable: false })
  class!: string;

  @Column("text", { nullable: false })
  frontImage!: string;

  @Column("text", { nullable: false })
  backImage!: string;

  @Column("text", { nullable: false })
  backgroundColor!: string;

  @Column("text", { nullable: false })
  textColor!: string;

  @Column("int4", { nullable: false })
  comoAmount!: number;

  @Index()
  @Column("text", { nullable: false })
  onOffline!: string;
}
