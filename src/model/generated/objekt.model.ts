import {
  Entity as Entity_,
  Column as Column_,
  PrimaryGeneratedColumn as PrimaryGeneratedColumn_,
  Index as Index_,
} from "typeorm";

@Entity_()
export class Objekt {
  constructor(props?: Partial<Objekt>) {
    Object.assign(this, props);
  }

  @PrimaryGeneratedColumn_("increment")
  id!: string;

  @Index_()
  @Column_("text", { nullable: false })
  contract!: string;

  @Index_()
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
}
