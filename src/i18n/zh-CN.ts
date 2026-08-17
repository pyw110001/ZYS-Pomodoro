export const zhCN = {
  brand: '专注小屋',
  nav: { focus: '专注', tasks: '任务', collection: '收藏', stats: '统计' },
  common: {
    close: '关闭', save: '保存', cancel: '取消', delete: '删除', rename: '重命名', fish: '鱼', minutes: '分钟', today: '今天', tomorrow: '明天', settings: '打开设置',
    minuteAmount: (minutes: number) => `${minutes} 分钟`, fishAmount: (fish: number) => `${fish} 鱼`, duration: (hours: number, minutes: number) => `${hours} 小时 ${minutes} 分`
  },
  shell: {
    loading: '正在打开小屋…', storageTitle: '小屋暂时无法保存数据', retry: '重新尝试',
    todayMinutes: (minutes: number) => `今日 ${minutes} 分钟`, mainNav: '主要导航', mobileNav: '移动端主要导航'
  },
  focus: {
    pomodoro: '番茄钟', countup: '正计时', start: '开始专注', pause: '暂停一下', resume: '继续专注',
    finish: '完成专注', abandon: '放弃本次', sound: '环境音', soundSettings: '环境音设置',
    off: '关闭', rain: '细雨', purr: '呼噜', custom: '我的音频', volume: '环境音音量', soundChoice: '环境音选择',
    uploadAudio: '上传音频', audioLibrary: '本地音频库', audioLibraryHint: '最多 5 个，单个 50 MB，总计 150 MB',
    playing: '正在播放', paused: '已暂停', resumeAudio: '点击继续播放', pauseAudio: '暂停环境音', noCustomAudio: '还没有上传环境音',
    renameAudioPrompt: '输入新的音频名称', deleteAudioConfirm: '删除这个本地音频？',
    helper: '完成专注，猫咪会为你带回一份小礼物', room: '布置房间', currentTask: '当前任务',
    noTask: '不关联任务', chooseTask: '选择一件要完成的事', controls: '专注计时控制', mode: '计时模式',
    duration: '专注时长', startError: '暂时无法开始专注', abandonConfirm: '确定放弃这次专注吗？超过 15 秒会留下一个揉皱的便签。'
  },
  tasks: {
    title: '我的任务', new: '新建任务', open: '进行中', done: '已完成', placeholder: '写下要完成的事',
    titleLabel: '任务标题', dueLabel: '截止日期', noDue: '无截止日期', markDone: '标记为已完成', markOpen: '标记为未完成',
    edit: '编辑任务', remove: '删除任务', removeConfirm: '删除这个任务？', addSlot: '添加任务', empty: '这里很安静，暂时没有任务。',
    focused: (minutes: number) => `已专注 ${minutes} 分钟`, progress: '今日完成'
  },
  collection: {
    title: '我的收藏', gifts: '礼物', room: '房间布置', rug: '地毯', cushion: '抱枕', decor: '摆件', equipped: '使用中',
    owned: '已拥有', saved: '布置已保存', saveLayout: '保存布置', giftTitle: '专注礼物',
    giftIntro: '完成专注会随机带回礼物，也可以用鱼币兑换还未拥有的物件。', exchanged: '已经放进收藏柜了', exchangeError: '暂时无法兑换',
    rarity: { common: '日常', rare: '珍藏', special: '特别' },
    items: { plant: '小叶盆栽', vase: '蓝陶花瓶', cushion: '橘色抱枕', rug: '云朵地毯', frame: '木质相框', plane: '纸飞机', mug: '黄釉马克杯', lamp: '小夜灯' }
  },
  stats: {
    title: '专注记录', range: '最近 7 天', duration: '专注时长', completed: '完成次数', abandoned: '放弃次数', daily: '每日专注', timeline: '今日记录',
    empty: '今天还没有记录，和猫咪开始一次专注吧。', unnamed: '未命名任务', free: '自由专注', chartCat: '正在记录的猫咪',
    days: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  },
  reward: { title: '专注完成', helper: '猫咪从窗边为你带回了一份小礼物', duplicate: '已经拥有，额外兑换了 2 鱼', accept: '收下礼物', records: '查看今日记录' },
  settings: {
    title: '小屋设置', language: '界面语言', chinese: '中文', english: 'English', focusLength: '默认番茄时长', reduceMotion: '减少动态效果', notification: '开启完成通知', notificationOn: '通知已开启',
    notificationUnsupported: '当前浏览器不支持通知', notificationOff: '通知未开启', export: '导出数据', import: '导入数据', reset: '重置全部数据',
    resetConfirm: '确定重置全部本地数据吗？此操作无法撤销。', privacy: '数据只保存在当前浏览器。建议定期导出备份。'
  },
  room: { label: '猫咪的专注房间', background: '手绘房间，窗边摆着绿色扶手椅', idleCat: '坐在椅子上的猫咪', focusCat: '正在陪你专注的猫咪' },
  system: {
    storageUnavailable: '当前浏览器无法使用本地存储，请检查隐私模式或存储权限后重试。', wakeLock: '当前浏览器无法保持屏幕常亮，计时仍会继续',
    countupShort: '正计时满 10 分钟后才能完成并获得礼物', focusComplete: '专注完成', hidden: '猫咪会继续替你看着时间，回来就好',
    initializing: '应用尚未初始化', anotherTab: '另一个标签页已有进行中的专注', accidentalCancel: '已取消误触的专注',
    abandoned: '这次先休息，猫咪替你收好了揉皱的便签', notEnoughFish: '鱼币还不够，再完成几次专注吧', restored: '数据已恢复', reset: '已恢复初始房间',
    dbUninitialized: '数据库尚未初始化', unsupportedData: '不支持的数据文件', audioType: '请选择 MP3、WAV、OGG、M4A、AAC 或 FLAC 音频',
    audioTooLarge: '单个音频不能超过 50 MB', audioCount: '本地音频库最多保存 5 个文件', audioTotal: '音频总容量不能超过 150 MB',
    audioQuota: '浏览器存储空间不足，无法保存该音频', audioUnsupported: '浏览器无法播放该音频格式', audioBlocked: '浏览器阻止了自动播放，请点击继续播放', audioSaved: '音频已保存到本地', audioDeleted: '音频已删除',
    notificationBody: (item: string, fish: number) => `猫咪为你带回了${item}，+${fish} 鱼`
  },
  starterTasks: { research: '完成产品调研', assets: '整理项目素材', reading: '阅读 30 分钟' }
}

export type Messages = typeof zhCN
