import {
  Entity as Entity_,
  Column as Column_,
  PrimaryGeneratedColumn as PrimaryGeneratedColumn_,
  Index as Index_,
} from "typeorm";

@Entity_()
export class ComoCalendar {
  constructor(props?: Partial<ComoCalendar>) {
    Object.assign(this, props);
  }

  @PrimaryGeneratedColumn_("increment")
  id!: string;

  @Index_()
  @Column_("text", { nullable: false })
  contract!: string;

  @Index_()
  @Column_("text", { nullable: false })
  address!: string;

  @Index_()
  @Column_("int4", { nullable: false })
  day!: number;

  @Column_("int4", { nullable: false })
  amount!: number;
}
