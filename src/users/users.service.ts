import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserModel } from './models/user.model';
import { InjectModel } from '@nestjs/sequelize';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ApiNoContentResponse } from '@nestjs/swagger';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
  ) {}
  
  async create(createUserDto: CreateUserDto) {

    const {password} = createUserDto

    const hashedPassword = await bcrypt.hash(password, 10);
    createUserDto.password = hashedPassword;

    const user = new UserEntity({
      email: createUserDto.email,
      fullName: createUserDto.fullName,
      password: hashedPassword,
    })
  
    return await this.userModel.create(user);
  }

  async findAll() {
    return await this.userModel.findAll();
  }

  async findOne(id: string) {
   const user = await this.userModel.findOne({where: {id}});

   if(!user){
    throw new NotFoundException()
   }

   return user
  }

  async findEmail(email: string) {
    return await this.userModel.findOne({where: {email}});
  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    const {password} = updateUserDto

    const hashedPassword = await bcrypt.hash(password, 10);
    updateUserDto.password = hashedPassword;

    const [affectedCount, updated] = await this.userModel.update(updateUserDto, {
      where: { id } ,
      returning: true
    });

    if (affectedCount == 0 && updated.length == 0){
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return updated[0];
  }

  async remove(id: string): Promise<void> {
    const deletedCount = await this.userModel.destroy({ where: { id } });
  
    if (deletedCount === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return;
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    this.userModel.update(
      { refreshToken },
      { where: { id } }
    );
  }

  async findByRefreshToken(refreshToken: string): Promise<UserEntity | null> {
    const user = await this.userModel.findOne({ where: { refreshToken } });
    return user 
  }
}
