import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTypeIdEnum } from '@quick-learn/shared';
import { UserEntity } from '@src/entities/user.entity';
import { Repository } from 'typeorm';
import { TeamService } from '../team/team.service';
import { SkillService } from '../skill/skill.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly teamService: TeamService,
    private readonly skillService: SkillService,
  ) {}

  async run() {
    const team = await this.teamService.getTeam();
    const superAdmin = await this.repository.count({
      where: { user_type_id: UserTypeIdEnum.SUPERADMIN },
    });
    let skill = await this.skillService.get();
    if (!skill) {
      skill = await this.skillService.create({
        name: 'Crownstack Test',
        team_id: team.id,
      });
    }
    if (!superAdmin) {
      const user: Partial<UserEntity> = {
        first_name: 'Super',
        last_name: 'Admin',
        user_type_id: UserTypeIdEnum.SUPERADMIN,
        email: 'super.admin@yopmail.com',
        password: 'password@123P',
        team_id: team.id,
        skill_id: skill.id,
      };
      const superAdminUser = this.repository.create(user);
      await this.repository.save(superAdminUser);
    }
  }
}
