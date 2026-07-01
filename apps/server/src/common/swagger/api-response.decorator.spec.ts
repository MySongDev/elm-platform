import type { OpenAPIObject } from '@nestjs/swagger'
import { Controller, Delete, Get, INestApplication, Post } from '@nestjs/common'
import {
  ApiProperty,
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger'
import { Test } from '@nestjs/testing'
import {
  ApiArrayResponse,
  ApiEmptyResponse,
  ApiErrorResponses,
  ApiRawResponse,
  ApiSuccessResponse,
  ERROR_DESCRIPTIONS,
} from './api-response.decorator'

interface ResponseWithSchema {
  description: string
  content: {
    'application/json': {
      schema: SchemaObject
    }
  }
}

type SchemaObject = Exclude<
  NonNullable<
    NonNullable<OpenAPIObject['components']>['schemas']
  >[string],
  { $ref: string }
>

const ERROR_STATUSES = [400, 401, 429, 500] as const

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
    ] as ResponseWithSchema

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
    ] as ResponseWithSchema

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
    ] as ResponseWithSchema

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
    ] as ResponseWithSchema

    expect(response.content!['application/json'].schema).toEqual({
      $ref: '#/components/schemas/FixtureDataDto',
    })
  })

  it('documents the success envelope contract', () => {
    const schema = document.components!.schemas!
      .ApiResponseEnvelopeDto as SchemaObject

    expect(schema.required).toEqual(['code', 'message', 'timestamp'])
    expect(schema.properties).toEqual(
      expect.objectContaining({
        code: expect.any(Object),
        message: expect.any(Object),
        timestamp: expect.objectContaining({ format: 'date-time' }),
      }),
    )
    expect(schema.properties).not.toHaveProperty('data')
  })

  it('documents the error response contract', () => {
    const schema = document.components!.schemas!.ApiErrorResponseDto as SchemaObject

    expect(schema.required).toEqual(['code', 'message', 'timestamp', 'path'])
    expect(schema.properties).toEqual(
      expect.objectContaining({
        code: expect.any(Object),
        message: expect.any(Object),
        timestamp: expect.objectContaining({ format: 'date-time' }),
        path: expect.any(Object),
      }),
    )
  })
  it.each(ERROR_STATUSES)(
    'documents the %i error response with status-specific examples',
    (status) => {
      const response = document.paths[
        '/swagger-fixture/error'
      ].get!.responses[String(status)] as ResponseWithSchema

      expect(response).toBeDefined()
      expect(response.content['application/json'].schema).toEqual({
        allOf: [
          { $ref: '#/components/schemas/ApiErrorResponseDto' },
          {
            properties: {
              code: { example: status },
              message: { example: ERROR_DESCRIPTIONS[status] },
            },
          },
        ],
      })
    },
  )
})
