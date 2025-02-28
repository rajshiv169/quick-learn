import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leaderboard } from '@src/entities/leaderboard.entity';
import { Cron } from '@nestjs/schedule';
import { CRON_TIMEZONE } from '@src/common/enum/daily_lesson.enum';
import {
  EnvironmentEnum,
  LeaderboardTypeEnum,
} from '@src/common/constants/constants';
import { UserEntity } from '@src/entities/user.entity';
import { UsersService } from '@src/routes/users/users.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@src/common/modules/email/email.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { QuarterlyLeaderboardEntity } from '@src/entities';
import Helpers from '@src/common/utils/helper';
@Injectable()
export class LeaderboardCronService {
  private frontendURL: string;
  private readonly logger = new Logger(LeaderboardCronService.name);
  private readonly BATCH_SIZE = 10;
  constructor(
    @InjectRepository(Leaderboard)
    private readonly leaderboardRepository: Repository<Leaderboard>,
    private readonly leaderboardService: LeaderboardService,
    @InjectRepository(QuarterlyLeaderboardEntity)
    private readonly quarterRepository: Repository<QuarterlyLeaderboardEntity>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.frontendURL = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });
  }

  @Cron('0 6 * * 1', {
    name: 'sendWeeklyLeaderboardEmail',
    timeZone: CRON_TIMEZONE,
    disabled: process.env.ENV !== EnvironmentEnum.Production,
  })
  async sendWeeklyLeaderboardEmail() {
    await this.sendLeaderboardEmail(LeaderboardTypeEnum.WEEKLY);
  }

  @Cron('0 7 1 * *', {
    name: 'sendMonthlyLeaderboardEmail',
    timeZone: CRON_TIMEZONE,
    disabled: process.env.ENV !== EnvironmentEnum.Production,
  })
  async sendMonthlyLeaderboardEmail() {
    await this.sendLeaderboardEmail(LeaderboardTypeEnum.MONTHLY);
  }

  @Cron('0 8 1 1,4,7,10 *', {
    //At 08:00 on day-of-month 1 in every 3rd month.

    name: 'sendQuarterlyLeaderboardEmail',
    timeZone: CRON_TIMEZONE,
    disabled: process.env.ENV !== EnvironmentEnum.Production,
  })
  async sendQuarterlyLeaderboardEmail() {
    await this.sendLeaderboardEmail(LeaderboardTypeEnum.QUARTERLY);
  }

  async sendLeaderboardEmail(type: LeaderboardTypeEnum) {
    let skip = 0;
    let processedCount = 0;
    if (type === LeaderboardTypeEnum.QUARTERLY) {
      await this.leaderboardService.createLeaderboardQuaterlyRanking(type);
    } else {
      await this.leaderboardService.createLeaderboardRanking(type);
    }

    this.logger.log('Created new leaderboard entries');

    const totalMembers = await this.getTotalMember(type);
    try {
      this.logger.log('Starting leaderboard email...');
      let userBatch: UserEntity[];
      do {
        userBatch = await this.usersService.getMany(
          {
            active: true,
            email_alert_preference: true,
          },
          {},
          [],
          this.BATCH_SIZE,
          skip,
        );
        if (userBatch.length > 0) {
          await Promise.all(
            userBatch.map((user) =>
              this.generateLeaderboardEmail(user, totalMembers, type),
            ),
          );
          processedCount += userBatch.length;
          this.logger.log(`Processed ${processedCount} users`);
          skip += this.BATCH_SIZE;
        }
      } while (userBatch.length > 0);
    } catch (error) {
      this.logger.error('Error in leaderboard email:', error);
      throw error;
    }
  }

  async getTotalMember(type: LeaderboardTypeEnum) {
    if (type === LeaderboardTypeEnum.QUARTERLY)
      return await this.quarterRepository.count({
        where: {
          quarter: Helpers.getPreviousQuarter(),
          year: new Date().getFullYear(),
        },
      });
    else
      return await this.leaderboardRepository.count({
        where: {
          type: type,
        },
      });
  }

  async getUser(type: LeaderboardTypeEnum, id: number) {
    if (type === LeaderboardTypeEnum.QUARTERLY)
      return await this.quarterRepository.findOne({
        where: {
          user_id: id,
          quarter: Helpers.getPreviousQuarter(),
          year: new Date().getFullYear(),
        },
      });
    else
      return await this.leaderboardRepository.findOne({
        where: {
          user_id: id,
          type: type,
        },
      });
  }

  async generateLeaderboardEmail(
    user: UserEntity,
    totalMembers: number,
    type: LeaderboardTypeEnum,
  ) {
    try {
      const userLeaderboardData = await this.getUser(type, user.id);

      if (userLeaderboardData) {
        const leaderboardData = {
          type: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
          fullName: user.display_name,
          rank: userLeaderboardData.rank,
          totalMembers: totalMembers,
          leaderboardLink: `${this.frontendURL}/dashboard/leaderboard?type=${type}`,
        };
        await this.emailService.leaderboardEmail(leaderboardData, user.email);
      }
    } catch (error) {
      this.logger.error('Error in leaderboard email:', error);
    }
  }
}
