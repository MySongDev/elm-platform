import type { ResponseObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import { Controller, Delete, Get, INestApplication, Post } from '@nestjs/common'
import {
  ApiProperty,
  DocumentBuilder,
  OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger'
import { Test } from '@nestjs/testing'
import {
  ApiArrayResponse,
  ApiEmptyResponse,
  ApiErrorResponses,
  ApiRawResponse,
  ApiSuccessResponse,
} from './api-response.decorator'

class FixtureDataDto {
  @ApiProperty({
    description: '资源 ID',
    example: 1,
  })
  id!: number
}

@Controller('swagger-fixture')
class SwaggerFixtureController {
  @Get('one')
  @ApiSuccessResponse(FixtureDataDto, { description: '获取单个资源' })
  getOne() {}

  @Get('many')
  @ApiArrayResponse(FixtureDataDto)
  getMany() {}

  @Post('created')
  @ApiSuccessResponse(FixtureDataDto, { status: 201 })
  create() {}

  @Delete('empty')
  @ApiEmptyResponse()
  remove() {}

  @Get('raw')
  @ApiRawResponse(FixtureDataDto)
  getRaw() {}

  @Get('error')
  @ApiErrorResponses(400, 401, 429, 500)
  getError() {}
}

describe('swagger response decorators', () => {
  let app: INestApplication
  let document: OpenAPIObject

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SwaggerFixtureController],
    }).compile()

    app = moduleRef.createNestApplication()
    const config = new DocumentBuilder().setTitle('Swagger fixture').build()
    document = SwaggerModule.createDocument(app, config)
  })

  afterAll(async () => {
    await app.close()
  })

  it('documents an enveloped single-object response', () => {
    const response = document.paths['/swagger-fixture/one'].get!.responses[
      '200'
    ] as ResponseObject

    expect(response.description).toBe('获取单个资源')
    expect(response.content!['application/json'].schema).toEqual({
      title: 'ApiResponseOfFixtureDataDto',
      allOf: [
        { $ref: '#/components/schemas/ApiResponseEnvelopeDto' },
        {
          type: 'object',
          required: ['data'],
          properties: {
            data: { $ref: '#/components/schemas/FixtureDataDto' },
          },
        },
      ],
    })
  })

  it('documents an enveloped array response', () => {
    const response = document.paths['/swagger-fixture/many'].get!.responses[
      '200'
    ] as ResponseObject

    expect(response.content!['application/json'].schema).toEqual({
      title: 'ApiArrayResponseOfFixtureDataDto',
      allOf: [
        { $ref: '#/components/schemas/ApiResponseEnvelopeDto' },
        {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/FixtureDataDto' },
            },
          },
        },
      ],
    })
  })

  it('supports a custom success status', () => {
    const responses = document.paths['/swagger-fixture/created'].post!.responses

    expect(responses['201']).toBeDefined()
    expect(responses['200']).toBeUndefined()
  })

  it('documents an empty response with only the envelope schema', () => {
    const response = document.paths['/swagger-fixture/empty'].delete!.responses[
      '200'
    ] as ResponseObject

    expect(response.content!['application/json'].schema).toEqual({
      $ref: '#/components/schemas/ApiResponseEnvelopeDto',
    })
    expect(document.components!.schemas!.ApiResponseEnvelopeDto).not.toHaveProperty(
      'properties.data',
    )
  })

  it('documents a raw response without the envelope schema', () => {
    const response = document.paths['/swagger-fixture/raw'].get!.responses[
      '200'
    ] as ResponseObject

    expect(response.content!['application/json'].schema).toEqual({
      $ref: '#/components/schemas/FixtureDataDto',
    })
  })

  it.each([400, 401, 429, 500])(
    'documents the %i error response with the shared error model',
    (status) => {
      const response = document.paths[
        '/swagger-fixture/error'
      ].get!.responses[String(status)] as ResponseObject

      expect(response).toBeDefined()
      expect(response.content!['application/json'].schema).toEqual({
        $ref: '#/components/schemas/ApiErrorResponseDto',
      })
    },
  )
})
