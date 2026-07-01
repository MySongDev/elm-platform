import { applyDecorators, Type } from '@nestjs/common'
import {
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger'
import {
  ApiErrorResponseDto,
  ApiResponseEnvelopeDto,
} from './api-response.dto'

export interface ApiSuccessOptions {
  description?: string
  status?: number
}

export type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500

export const ERROR_DESCRIPTIONS: Readonly<Record<ErrorStatus, string>> = {
  400: '请求参数错误',
  401: '未认证或认证已失效',
  403: '无权访问该资源',
  404: '请求的资源不存在',
  409: '资源状态冲突',
  429: '请求过于频繁',
  500: '服务器内部错误',
}

export function ApiSuccessResponse<T>(
  model: Type<T>,
  options: ApiSuccessOptions = {},
) {
  return applyDecorators(
    ApiExtraModels(ApiResponseEnvelopeDto, model),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description ?? '请求成功',
      schema: {
        title: `ApiResponseOf${model.name}`,
        allOf: [
          { $ref: getSchemaPath(ApiResponseEnvelopeDto) },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  )
}

export function ApiArrayResponse<T>(
  model: Type<T>,
  options: ApiSuccessOptions = {},
) {
  return applyDecorators(
    ApiExtraModels(ApiResponseEnvelopeDto, model),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description ?? '请求成功',
      schema: {
        title: `ApiArrayResponseOf${model.name}`,
        allOf: [
          { $ref: getSchemaPath(ApiResponseEnvelopeDto) },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  )
}

export function ApiEmptyResponse(options: ApiSuccessOptions = {}) {
  return applyDecorators(
    ApiExtraModels(ApiResponseEnvelopeDto),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description ?? '请求成功',
      schema: { $ref: getSchemaPath(ApiResponseEnvelopeDto) },
    }),
  )
}

export function ApiRawResponse<T>(
  model: Type<T>,
  options: ApiSuccessOptions = {},
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description ?? '请求成功',
      schema: { $ref: getSchemaPath(model) },
    }),
  )
}

export function ApiErrorResponses(...statuses: ErrorStatus[]) {
  return applyDecorators(
    ApiExtraModels(ApiErrorResponseDto),
    ...statuses.map(status =>
      ApiResponse({
        status,
        description: ERROR_DESCRIPTIONS[status],
        schema: {
          allOf: [
            { $ref: getSchemaPath(ApiErrorResponseDto) },
            {
              properties: {
                code: { example: status },
                message: { example: ERROR_DESCRIPTIONS[status] },
              },
            },
          ],
        },
      }),
    ),
  )
}
