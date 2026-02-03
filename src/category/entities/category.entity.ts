import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { SubCategory } from './subcategory.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  categoryId: string;

  @Column({ type: 'varchar', length: 255 })
  categoryName: string;

  @OneToMany(() => SubCategory, (subCategory) => subCategory.category, {
    cascade: true,
    eager: true,
  })
  subcategory: SubCategory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
