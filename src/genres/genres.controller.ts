// src/genres/genres.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GenresService } from './genres.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import {
  CreateGenreDto,
  GenreResponseDto,
  UpdateGenreDto,
} from './dto/genre.dto';

@ApiTags('genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get()
  @ApiOkResponse({ type: GenreResponseDto, isArray: true })
  listGenres(): Promise<GenreResponseDto[]> {
    return this.genresService.listGenres();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @ApiOkResponse({ type: GenreResponseDto })
  createGenre(@Body() body: CreateGenreDto): Promise<GenreResponseDto> {
    return this.genresService.createGenre(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':genreId')
  @ApiOkResponse({ type: GenreResponseDto })
  updateGenre(
    @Param('genreId', ParseIntPipe) genreId: number,
    @Body() body: UpdateGenreDto,
  ): Promise<GenreResponseDto> {
    return this.genresService.updateGenre(genreId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':genreId')
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  deleteGenre(
    @Param('genreId', ParseIntPipe) genreId: number,
  ): Promise<{ deleted: boolean }> {
    return this.genresService.deleteGenre(genreId);
  }
}
