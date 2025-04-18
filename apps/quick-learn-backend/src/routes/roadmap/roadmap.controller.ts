import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoadmapService } from './roadmap.service';
import { SuccessResponse } from '@src/common/dto';
import { en } from '@src/lang/en';
import { JwtAuthGuard } from '../auth/guards';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { CurrentUser } from '@src/common/decorators/current-user.decorators';
import { UserEntity } from '@src/entities';
import { AssignCoursesToRoadmapDto } from './dto/assing-courses-to-roadmap';
import { PaginationDto } from '../users/dto';
import { ActivateRoadmapDto } from './dto/activate-roadmap.dto';
import { RoadmapParamDto, RoadmapQueryDto } from './dto/roadmap-param.dto';
import { UserTypeIdEnum } from '@quick-learn/shared';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@src/common/decorators/roles.decorator';

@ApiTags('Roadmap')
@Controller({
  path: 'roadmap',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class RoadmapController {
  constructor(private readonly service: RoadmapService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roadmaps' })
  async getRoadmap(@CurrentUser() user: UserEntity) {
    const roadmaps = await this.service.getAllRoadmaps(user);
    return new SuccessResponse(en.GetAllRoapmaps, roadmaps);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new roadmap' })
  async createRoadmap(
    @Body() createRoadmapDto: CreateRoadmapDto,
    @CurrentUser() user: UserEntity,
  ) {
    const roadmap = await this.service.createRoadmap(createRoadmapDto, user);
    return new SuccessResponse(en.CreateRoadmap, roadmap);
  }

  @Get('archived')
  @UseGuards(RolesGuard)
  @Roles(UserTypeIdEnum.SUPERADMIN, UserTypeIdEnum.ADMIN)
  @ApiOperation({ summary: 'Get Archived Roadmaps' })
  async findAllArchivedRoadmaps(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: UserEntity,
  ) {
    const roadmaps = await this.service.findAllArchived(paginationDto, user);
    return new SuccessResponse(en.GetAllRoapmaps, roadmaps);
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate or archive roadmap' })
  async activateRoadmap(
    @Body() activateRoadmapDto: ActivateRoadmapDto,
    @CurrentUser() user: UserEntity,
  ): Promise<SuccessResponse> {
    const { active, id } = activateRoadmapDto;
    const updatedRoadmap = await this.service.updateRoadmap(
      id,
      { active },
      user,
    );
    return new SuccessResponse(en.RoadmapStatusUpdated, updatedRoadmap);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get roadmap details' })
  async getRoadmapDetails(
    @Param() param: RoadmapParamDto,
    @Query() query: RoadmapQueryDto,
    @CurrentUser() user: UserEntity,
  ) {
    const isArchived = query.archived === 'true';
    const roadmaps =
      await this.service.getRoadmapDetailsWithCourseAndLessonsCount(
        Number(param.id),
        query.courseId ? Number(query.courseId) : undefined,
        isArchived,
        user.team_id,
      );
    return new SuccessResponse(en.GetAllRoapmaps, roadmaps);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a roadmap' })
  async updateRoadmap(
    @Param() param: RoadmapParamDto,
    @Body() updateRoadmapDto: UpdateRoadmapDto,
    @CurrentUser() userID: UserEntity,
  ) {
    const roadmap = await this.service.updateRoadmap(
      +param.id,
      updateRoadmapDto,
      userID,
    );
    return new SuccessResponse(en.updateRoadmap, roadmap);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign courses to roadmap' })
  async assignCoursesRoadmap(
    @Param() param: RoadmapParamDto,
    @Body() assignCoursesToRoadmapDto: AssignCoursesToRoadmapDto,
    @CurrentUser() user: UserEntity,
  ) {
    await this.service.assignRoadmap(
      +param.id,
      assignCoursesToRoadmapDto,
      user.team_id,
    );
    return new SuccessResponse(en.RoadmapCoursesAssigned);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete roadmap' })
  async deleteRoadmap(
    @Param() param: RoadmapParamDto,
    @CurrentUser() user: UserEntity,
  ) {
    await this.service.deleteRoadmap(+param.id, user.team_id);
    return new SuccessResponse(en.successDeleteRoadmap);
  }
}
