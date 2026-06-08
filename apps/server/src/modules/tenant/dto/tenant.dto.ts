import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator'
import { tenantEvents } from '../tenant.types'

export class CreateTenantDto {
  @IsString()
  @Length(2, 64)
  name!: string

  @IsString()
  @Length(2, 64)
  code!: string

  @IsOptional()
  @IsString()
  contactName?: string

  @IsOptional()
  @IsString()
  contactPhone?: string

  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @IsOptional()
  @IsString()
  planCode?: string

  @IsOptional()
  @IsString()
  remark?: string
}

export class UpdateTenantDto {
  @IsString()
  @Length(2, 64)
  name!: string

  @IsOptional()
  @IsString()
  contactName?: string

  @IsOptional()
  @IsString()
  contactPhone?: string

  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @IsOptional()
  @IsString()
  planCode?: string

  @IsOptional()
  @IsString()
  remark?: string
}

export class TenantTransitionDto {
  @IsOptional()
  @IsString()
  reason?: string

  @IsOptional()
  @IsString()
  remark?: string
}

export class TenantEventParamDto {
  @IsIn(tenantEvents)
  event!: string
}
