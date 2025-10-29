import { Worker } from '@temporalio/worker'
import * as activities from './activities'

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'finance-os',
  })

  console.log('🔄 Temporal worker started')
  await worker.run()
}

run().catch((err) => {
  console.error('❌ Worker failed:', err)
  process.exit(1)
})
