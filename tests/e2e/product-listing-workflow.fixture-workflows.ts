import type { ProductListingWorkflowView } from '../../src/features/product-listing/types';
import {
  FIRST_DRY_RUN_ID,
  PRODUCT_LISTING_WORKFLOW_PSKU,
  SECOND_DRY_RUN_ID,
  draftView,
  dryRunTask,
  realRunTask
} from './product-listing-workflow.fixture-data';

export type ProductListingWorkflowStage =
  | 'editing'
  | 'ready-first'
  | 'editing-reopened'
  | 'ready-second'
  | 'publishing'
  | 'reauthentication-required'
  | 'create-unknown'
  | 'continue-after-create'
  | 'verify-readback'
  | 'replay-projection'
  | 'published';

export function productListingWorkflowForStage(
  stage: ProductListingWorkflowStage
): ProductListingWorkflowView {
  switch (stage) {
    case 'editing':
      return {
        phase: 'EDITING',
        writeCertainty: 'NOT_STARTED',
        nextAction: 'REVIEW_DRAFT',
        message: '完善商品资料后，可以检查并提交上架。',
        draft: draftView()
      };
    case 'editing-reopened':
      return {
        phase: 'EDITING',
        writeCertainty: 'NOT_STARTED',
        nextAction: 'REVIEW_DRAFT',
        message: '上一次检查已作废，可以修改后重新检查。',
        draft: draftView(),
        dryRunTask: {
          ...dryRunTask(FIRST_DRY_RUN_ID),
          status: 'superseded'
        }
      };
    case 'ready-first':
      return readyWorkflow(FIRST_DRY_RUN_ID);
    case 'ready-second':
      return readyWorkflow(SECOND_DRY_RUN_ID);
    case 'publishing':
      return {
        phase: 'PUBLISHING',
        writeCertainty: 'UNKNOWN',
        nextAction: 'WAIT',
        message: '正在写入 Noon，请等待后端确认结果。',
        draft: draftView(),
        dryRunTask: dryRunTask(SECOND_DRY_RUN_ID),
        realRunTask: realRunTask('running')
      };
    case 'reauthentication-required':
      return {
        phase: 'ACTION_REQUIRED',
        writeCertainty: 'NOT_STARTED',
        nextAction: 'REAUTHENTICATE',
        reasonCode: 'noon_authentication_required',
        message: 'Noon 授权已失效，请重新授权后复核商品资料。',
        draft: draftView(),
        dryRunTask: dryRunTask(SECOND_DRY_RUN_ID),
        realRunTask: realRunTask(
          'failed',
          'noon_authentication_required'
        )
      };
    case 'create-unknown':
      return {
        phase: 'ACTION_REQUIRED',
        writeCertainty: 'UNKNOWN',
        nextAction: 'CHECK_CREATE_RESULT',
        reasonCode: 'noon_create_outcome_unknown',
        message: 'Noon 创建结果暂不确定，请先核对创建结果。',
        draft: draftView(),
        dryRunTask: dryRunTask(SECOND_DRY_RUN_ID),
        realRunTask: realRunTask(
          'written_verify_failed',
          'noon_create_outcome_unknown'
        )
      };
    case 'continue-after-create':
      return {
        phase: 'ACTION_REQUIRED',
        writeCertainty: 'WRITTEN',
        nextAction: 'CONTINUE_AFTER_CREATE',
        reasonCode: 'create_found_remaining_steps_pending',
        message: '已确认 Noon 商品存在，请继续完成剩余写入。',
        draft: draftView(),
        dryRunTask: dryRunTask(SECOND_DRY_RUN_ID),
        realRunTask: realRunTask(
          'written_verify_failed',
          'remaining_steps_pending',
          [
            {
              stepKey: 'resolve_create_outcome',
              status: 'succeeded',
              externalReference:
                `skuParent=N-SA-WF-7001;pskuCode=${PRODUCT_LISTING_WORKFLOW_PSKU}`
            }
          ]
        )
      };
    case 'verify-readback':
      return {
        phase: 'ACTION_REQUIRED',
        writeCertainty: 'WRITTEN',
        nextAction: 'VERIFY_READBACK',
        reasonCode: 'readback_mismatch',
        message: 'Noon 已写入，但回读校验未通过，请重新回读。',
        draft: draftView(),
        dryRunTask: dryRunTask(SECOND_DRY_RUN_ID),
        realRunTask: realRunTask('written_verify_failed', 'readback_mismatch', [
          {
            stepKey: 'create',
            status: 'succeeded',
            externalReference: 'N-SA-WF-7001'
          },
          {
            stepKey: 'verify_readback',
            status: 'failed',
            failureCode: 'readback_mismatch'
          }
        ])
      };
    case 'replay-projection':
      return {
        phase: 'ACTION_REQUIRED',
        writeCertainty: 'VERIFIED',
        nextAction: 'REPLAY_PROJECTION',
        reasonCode: 'projection_backfill_failed',
        message: 'Noon 已校验成功，请恢复本地商品资料。',
        draft: draftView(),
        dryRunTask: dryRunTask(SECOND_DRY_RUN_ID),
        realRunTask: realRunTask(
          'written_verify_failed',
          'projection_backfill_failed',
          [
            {
              stepKey: 'create',
              status: 'succeeded',
              externalReference: 'N-SA-WF-7001'
            },
            { stepKey: 'verify_readback', status: 'succeeded' },
            {
              stepKey: 'project_local',
              status: 'failed',
              failureCode: 'projection_backfill_failed'
            }
          ],
          true
        )
      };
    case 'published':
      return {
        phase: 'PUBLISHED',
        writeCertainty: 'VERIFIED',
        nextAction: 'NONE',
        message: '商品已成功写入 Noon，并通过回读确认。',
        draft: draftView(),
        dryRunTask: dryRunTask(SECOND_DRY_RUN_ID),
        realRunTask: realRunTask(
          'succeeded',
          undefined,
          [
            {
              stepKey: 'create',
              status: 'succeeded',
              externalReference: 'N-SA-WF-7001'
            },
            { stepKey: 'verify_readback', status: 'succeeded' },
            { stepKey: 'project_local', status: 'succeeded' }
          ],
          true
        )
      };
  }
}

function readyWorkflow(dryRunId: number): ProductListingWorkflowView {
  return {
    phase: 'READY_TO_CONFIRM',
    writeCertainty: 'NOT_STARTED',
    nextAction: 'CONFIRM_PUBLISH',
    message: '上架检查已通过，请确认是否写入 Noon。',
    draft: draftView(),
    dryRunTask: dryRunTask(dryRunId)
  };
}
