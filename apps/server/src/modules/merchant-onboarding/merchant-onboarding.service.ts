import type { MerchantApplication, MerchantApplicationActionLog, Prisma } from '@prisma/client'
import type {
  ApplicationMaterial,
  MerchantApplicationActor,
  MerchantApplicationQuery,
  MerchantApplicationReviewAction,
  MerchantApplicationReviewPayload,
  MerchantApplicationStatus,
} from './merchant-onboarding.types'
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  assertMerchantApplicationActorCanTrigger,
  getAvailableMerchantApplicationActions,
  getNextMerchantApplicationStatus,
} from './merchant-onboarding-state-machine.policy'
import {
  merchantApplicationReviewActions,
  merchantApplicationStatuses,
} from './merchant-onboarding.types'

type MerchantApplicationRecord = MerchantApplication
type MerchantApplicationLogRecord = MerchantApplicationActionLog

const DEFAULT_LIST_LIMIT = 200
const MAX_PAGE_SIZE = 200

@Injectable()
export class MerchantOnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async listApplications(query: MerchantApplicationQuery = {}) {
    const args: Prisma.MerchantApplicationFindManyArgs = {
      where: this.buildListWhere(query),
      orderBy: { createdAt: 'desc' },
      ...this.buildPagination(query),
    }
    const applications = await this.prisma.merchantApplication.findMany(args)

    return applications.map((application: MerchantApplicationRecord) => this.toApplication(application))
  }

  async getApplicationDetail(id: string) {
    const application = await this.prisma.merchantApplication.findUnique({
      where: { id },
    })

    if (!application)
      throw new NotFoundException('Merchant application not found')

    return this.toApplication(application)
  }

  async reviewApplication(
    id: string,
    payload: MerchantApplicationReviewPayload,
    actor: MerchantApplicationActor,
  ) {
    const action = payload.action as MerchantApplicationReviewAction
    this.assertReviewAction(action)
    this.assertReasonIfRequired(action, payload.reason)

    const application = await this.prisma.merchantApplication.findUnique({
      where: { id },
    })

    if (!application)
      throw new NotFoundException('Merchant application not found')

    assertMerchantApplicationActorCanTrigger(action, actor.type)
    const currentStatus = application.status as MerchantApplicationStatus
    const nextStatus = getNextMerchantApplicationStatus(currentStatus, action)

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.merchantApplication.updateMany({
        where: {
          id,
          status: currentStatus,
        },
        data: {
          status: nextStatus,
        },
      })

      if (updated.count !== 1)
        throw new ConflictException('Merchant application status changed, please refresh and retry')

      await tx.merchantApplicationActionLog.create({
        data: {
          applicationId: id,
          event: action,
          fromStatus: currentStatus,
          toStatus: nextStatus,
          actorId: String(actor.id),
          actorName: actor.name,
          actorType: actor.type,
          reason: payload.reason,
          remark: payload.remark,
        },
      })

      await tx.operationLog.create({
        data: {
          username: actor.name,
          module: 'Merchant Onboarding',
          action: `Merchant application ${action}`,
          method: 'POST',
          path: `/admin/merchant-applications/${id}/review`,
          status: 200,
          duration: 0,
        },
      })
    })

    const updatedApplication = await this.prisma.merchantApplication.findUniqueOrThrow({
      where: { id },
    })
    return this.toApplication(updatedApplication)
  }

  async getApplicationActionLogs(id: string) {
    await this.ensureApplicationExists(id)
    const logs = await this.prisma.merchantApplicationActionLog.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
    })

    return logs.map((log: MerchantApplicationLogRecord) => this.toActionLog(log))
  }

  private buildListWhere(query: MerchantApplicationQuery): Prisma.MerchantApplicationWhereInput {
    const where: Prisma.MerchantApplicationWhereInput = {}

    if (this.isMerchantApplicationStatus(query.status)) {
      where.status = query.status
    }

    const merchantName = typeof query.merchantName === 'string' ? query.merchantName.trim() : ''
    if (merchantName) {
      where.merchantName = {
        contains: merchantName,
        mode: 'insensitive',
      }
    }

    return where
  }

  private buildPagination(query: MerchantApplicationQuery) {
    const pageSize = this.toPositiveInt(query.pageSize)
    const page = this.toPositiveInt(query.page)

    if (!pageSize) {
      return {
        take: DEFAULT_LIST_LIMIT,
      }
    }

    const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE)
    const safePage = page ?? 1
    return {
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }
  }

  private async ensureApplicationExists(id: string) {
    const application = await this.prisma.merchantApplication.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!application)
      throw new NotFoundException('Merchant application not found')
  }

  private toApplication(application: MerchantApplicationRecord) {
    const status = application.status as MerchantApplicationStatus
    return {
      id: application.id,
      merchantName: application.merchantName,
      contactName: application.contactName,
      contactPhone: application.contactPhone,
      businessCategory: application.businessCategory,
      address: application.address,
      status,
      availableActions: getAvailableMerchantApplicationActions(status),
      materials: this.toMaterials(application.materials),
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    }
  }

  private toActionLog(log: MerchantApplicationLogRecord) {
    return {
      id: String(log.id),
      event: log.event,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      actorName: log.actorName,
      reason: log.reason ?? undefined,
      remark: log.remark ?? undefined,
      createdAt: log.createdAt,
    }
  }

  private toMaterials(materials: unknown): ApplicationMaterial[] {
    return Array.isArray(materials) ? materials as ApplicationMaterial[] : []
  }

  private isMerchantApplicationStatus(status: unknown): status is MerchantApplicationStatus {
    return typeof status === 'string' && merchantApplicationStatuses.includes(status as MerchantApplicationStatus)
  }

  private assertReviewAction(action: string): asserts action is MerchantApplicationReviewAction {
    if (!merchantApplicationReviewActions.includes(action as MerchantApplicationReviewAction)) {
      throw new BadRequestException('Unsupported merchant application review action')
    }
  }

  private assertReasonIfRequired(action: MerchantApplicationReviewAction, reason?: string) {
    if ((action === 'REJECT' || action === 'REQUEST_SUPPLEMENT') && !reason?.trim()) {
      throw new BadRequestException('Reason is required for this review action')
    }
  }

  private toPositiveInt(value: unknown) {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1)
      return undefined
    return parsed
  }
}
