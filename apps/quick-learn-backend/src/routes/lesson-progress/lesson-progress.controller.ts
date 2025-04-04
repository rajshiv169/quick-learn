import { SuccessResponse } from '@src/common/dto';
import { JwtAuthGuard } from '../auth/guards';
import { LessonProgressService } from './lesson-progress.service';
import { Controller, Post, Param, Body, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@src/common/decorators/current-user.decorators';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { UserEntity } from '@src/entities';
import { en } from '@src/lang/en';
import { Public } from '@src/common/decorators/public.decorator';
import { LessonProgressCompleteDto } from './dto/lesson-progress-complete.dto';
import { LessonProgressCheckDto } from './dto/lesson-progress-check.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Lesson Progress')
@Controller({ path: 'lesson-progress', version: '1' })
@UseGuards(JwtAuthGuard)
export class LessonProgressController {
  constructor(
    private readonly lessonProgressService: LessonProgressService,
    private readonly userService: UsersService,
  ) {}

  @Get('progress/:courseId')
  async getLessonProgress(
    @Param('courseId') courseId: number,
    @CurrentUser() user: UserEntity,
  ) {
    const data = await this.lessonProgressService.getLessonProgressArray(
      user.id,
      courseId,
    );
    return new SuccessResponse(en.courseCompletedLessons, data);
  }

  @ApiParam({
    name: 'userID',
    required: false,
    type: 'string',
    description: 'user ID',
  })
  @Get('/user-progress{/:userID}')
  async getAllUserProgress(
    @CurrentUser() curentUser: UserEntity,
    @Param('userID') userID?: string,
  ) {
    const data =
      await this.lessonProgressService.getUserLessonProgressViaCourse(
        !isNaN(+userID) ? +userID : curentUser.id,
      );
    return new SuccessResponse(en.userProgressGrouped, data);
  }

  @ApiParam({
    name: 'userID',
    required: true,
    type: Number,
    description: 'user ID',
  })
  @Get('daily-lesson/:userID')
  async getAllDailyLesson(@Param('userID') userID: number) {
    const data =
      await this.lessonProgressService.getDailyLessonProgress(userID);
    return new SuccessResponse(en.allDailyLessons, data);
  }

  @Get('check/:lessonId{/:userId}')
  async checkIsRead(
    @Param() param: Partial<LessonProgressCheckDto>,
    @CurrentUser() user: UserEntity,
  ) {
    const currentUserViewed = param.userId ? param.userId : user.id;
    const data = await this.lessonProgressService.checkLessonRead(
      currentUserViewed,
      +param.lessonId,
    );
    return new SuccessResponse(en.lessonStatus, data);
  }

  @Get('check-public/:lessonId/:userId')
  @Public()
  async checkIsReadPublic(@Param() param: Partial<LessonProgressCheckDto>) {
    const currentUserViewed = param.userId;
    const data = await this.lessonProgressService.checkLessonRead(
      currentUserViewed,
      +param.lessonId,
    );
    return new SuccessResponse(en.lessonStatus, data);
  }

  @Post('complete/:lessonId{/:userId}')
  async markLessonAsCompleted(
    @Body() dto: { courseId: number; isCompleted: boolean },
    @CurrentUser() user: UserEntity,
    @Param() param: LessonProgressCompleteDto,
  ) {
    const currentUser = param.userId ? param.userId : user.id;
    const response = await this.lessonProgressService.markLessonAsCompleted(
      currentUser,
      +param.lessonId,
      dto.courseId,
      user.team_id,
    );
    if (dto.isCompleted) {
      return new SuccessResponse(en.successfullyCompletedLesson, {
        isRead: !!response,
        completed_date: response.completed_date,
      });
    } else {
      return new SuccessResponse(en.lessonMarkedUnRead);
    }
  }

  @Post('complete-public/:lessonId/:userId')
  @Public()
  async markLessonAsCompletedPublic(
    @Body() dto: { courseId: number; isCompleted: boolean },
    @Param() param: LessonProgressCompleteDto,
  ) {
    const currentUser = param.userId;
    const userDetail = await this.userService.findOne({ id: param.userId });
    const response = await this.lessonProgressService.markLessonAsCompleted(
      currentUser,
      +param.lessonId,
      dto.courseId,
      userDetail.team_id,
    );
    if (dto.isCompleted) {
      return new SuccessResponse(en.successfullyCompletedLesson, {
        isRead: !!response,
        completed_date: response.completed_date,
      });
    } else {
      return new SuccessResponse(en.lessonMarkedUnRead);
    }
  }
}
