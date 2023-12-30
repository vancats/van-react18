import './index.css'
import type { CallbackNode } from 'scheduler'
import {
    unstable_IdlePriority as IdlePriority,
    unstable_ImmediatePriority as ImmediatePriority,
    unstable_LowPriority as LowPriority,
    unstable_NormalPriority as NormalPriority,
    unstable_UserBlockingPriority as UserBlockingPriority,
    unstable_cancelCallback as cancelCallback,
    unstable_getFirstCallbackNode as getFirstCallbackNode,
    unstable_scheduleCallback as scheduleCallback,
    unstable_shouldYield as shouldYield,
} from 'scheduler'

type Priority = typeof ImmediatePriority | typeof UserBlockingPriority | typeof NormalPriority | typeof LowPriority | typeof IdlePriority

interface Work {
    count: number
    priority: Priority
}

const root = document.querySelector('#root')!;
[LowPriority, NormalPriority, UserBlockingPriority, ImmediatePriority].forEach(priority => {
    const button = document.createElement('button')
    button.innerHTML = [
        '',
        'ImmediatePriority',
        'UserBlockingPriority',
        'NormalPriority',
        'LowPriority',
    ][priority]
    button.onclick = () => {
        workList.push({
            count: 100,
            priority: priority as Priority,
        })
        schedule()
    }
    root.appendChild(button)
})

const workList: Work[] = []
// 上一个未执行完成 work 的优先级或者 IdlePriority
let prevPriority: Priority = IdlePriority
// 当前在执行的 callback
let curCallback: CallbackNode | null = null

// 策略逻辑
function schedule() {
    // 获取当前在执行的 callback
    const cbNode = getFirstCallbackNode()
    const curWork = workList.sort((work1, work2) => work1.priority - work2.priority)[0]
    if (!curWork) {
        // 代表当前的 work 已经是空的了
        curCallback = null
        cbNode && cancelCallback(cbNode)
        return
    }

    const { priority: curPriority } = curWork
    // 优先级相等
    if (curPriority === prevPriority) {
        return
    }

    // 更高优先级，取消之前调度的 work
    cbNode && cancelCallback(cbNode)
    curCallback = scheduleCallback(curPriority, perform.bind(null, curWork))
}

function perform(work: Work, didTimeout?: boolean) {
    /*
     * 考虑是否可以继续任务
     *  1. 优先级: 同步任务
     *  2. 饥饿问题: 是否过期
     *  3. 时间切片: 是否还有剩余的时间
     */
    const needSync = work.priority === ImmediatePriority || didTimeout
    while ((needSync || !shouldYield()) && work.count) {
        work.count--
        insertSpan(String(work.priority))
    }

    prevPriority = work.priority

    // 中断执行 || 执行结束
    if (!work.count) {
        const workIndex = workList.indexOf(work)
        workList.splice(workIndex, 1)
        prevPriority = IdlePriority
    }

    const prevCallback = curCallback
    schedule()
    const newCallback = curCallback

    // 如果在 schedule 中没有赋新的值，那么代表接下来调度的还是这个 work
    if (newCallback && prevCallback === newCallback) {
        return perform.bind(null, work)
    }
}

function insertSpan(context: string) {
    const span = document.createElement('span')
    span.innerText = context
    span.className = `pri-${context}`
    doSomeLazyWork(10000000)
    root.appendChild(span)
}

function doSomeLazyWork(len: number) {
    let result = 0
    while (len--) {
        result++
    }
}
