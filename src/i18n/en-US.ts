import type { Messages } from './zh-CN'

export const enUS: Messages = {
  brand: 'Focus Cottage',
  nav: { focus: 'Focus', tasks: 'Tasks', collection: 'Collection', stats: 'Stats' },
  common: {
    close: 'Close', save: 'Save', cancel: 'Cancel', delete: 'Delete', rename: 'Rename', fish: 'fish', minutes: 'minutes', today: 'Today', tomorrow: 'Tomorrow', settings: 'Open settings',
    minuteAmount: (minutes) => `${minutes} min`, fishAmount: (fish) => `${fish} fish`, duration: (hours, minutes) => `${hours} hr ${minutes} min`
  },
  shell: {
    loading: 'Opening your cottage…', storageTitle: 'Your cottage cannot save data right now', retry: 'Try again',
    todayMinutes: (minutes) => `Today ${minutes} min`, mainNav: 'Main navigation', mobileNav: 'Mobile navigation'
  },
  focus: {
    pomodoro: 'Pomodoro', countup: 'Count up', start: 'Start focus', pause: 'Take a pause', resume: 'Keep focusing', finish: 'Finish focus', abandon: 'Give up',
    sound: 'Ambient sound', soundSettings: 'Ambient sound settings', off: 'Off', rain: 'Rain', purr: 'Purr', custom: 'My audio', volume: 'Ambient sound volume', soundChoice: 'Ambient sound choice',
    uploadAudio: 'Upload audio', audioLibrary: 'Local audio library', audioLibraryHint: 'Up to 5 files, 50 MB each, 150 MB total', playing: 'Playing', paused: 'Paused', resumeAudio: 'Tap to resume playback', pauseAudio: 'Pause ambient sound', noCustomAudio: 'No custom ambient audio yet',
    renameAudioPrompt: 'Enter a new audio name', deleteAudioConfirm: 'Delete this local audio file?',
    helper: 'Finish a focus session and your cat will bring back a little gift', room: 'Decorate room', currentTask: 'Current task', noTask: 'No linked task', chooseTask: 'Choose something to finish', controls: 'Focus timer controls', mode: 'Timer mode', duration: 'Focus duration', startError: 'Unable to start focus right now', abandonConfirm: 'Give up this focus session? After 15 seconds, a crumpled note will be kept.'
  },
  tasks: {
    title: 'My Tasks', new: 'New task', open: 'In progress', done: 'Completed', placeholder: 'Write down what you want to finish', titleLabel: 'Task title', dueLabel: 'Due date', noDue: 'No due date', markDone: 'Mark as completed', markOpen: 'Mark as open', edit: 'Edit task', remove: 'Delete task', removeConfirm: 'Delete this task?', addSlot: 'Add task', empty: 'It is quiet here. No tasks yet.', focused: (minutes) => `Focused for ${minutes} min`, progress: 'Completed today'
  },
  collection: {
    title: 'My Collection', gifts: 'Gifts', room: 'Room', rug: 'Rugs', cushion: 'Cushions', decor: 'Decor', equipped: 'In use', owned: 'Owned', saved: 'Layout saved', saveLayout: 'Save layout', giftTitle: 'Focus Gifts', giftIntro: 'Complete focus sessions to bring back random gifts, or exchange fish for items you do not own yet.', exchanged: 'Added to your collection', exchangeError: 'Unable to exchange right now',
    rarity: { common: 'Everyday', rare: 'Treasured', special: 'Special' },
    items: { plant: 'Leafy Plant', vase: 'Blue Ceramic Vase', cushion: 'Orange Cushion', rug: 'Cloud Rug', frame: 'Wooden Frame', plane: 'Paper Plane', mug: 'Yellow Glazed Mug', lamp: 'Night Light' }
  },
  stats: {
    title: 'Focus History', range: 'Last 7 days', duration: 'Focus time', completed: 'Completed', abandoned: 'Abandoned', daily: 'Daily focus', timeline: 'Today’s timeline', empty: 'No sessions today. Start focusing with your cat.', unnamed: 'Unnamed task', free: 'Free focus', chartCat: 'Cat keeping focus records', days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  },
  reward: { title: 'Focus Complete', helper: 'Your cat brought back a little gift from the window', duplicate: 'Already owned — exchanged for 2 extra fish', accept: 'Accept gift', records: 'View today’s history' },
  settings: {
    title: 'Cottage Settings', language: 'Language', chinese: '中文', english: 'English', focusLength: 'Default Pomodoro length', reduceMotion: 'Reduce motion', notification: 'Enable completion notifications', notificationOn: 'Notifications enabled', notificationUnsupported: 'Notifications are not supported in this browser', notificationOff: 'Notifications were not enabled', export: 'Export data', import: 'Import data', reset: 'Reset all data', resetConfirm: 'Reset all local data? This cannot be undone.', privacy: 'Your data stays in this browser. Export a backup regularly.'
  },
  room: { label: 'The cat’s focus room', background: 'A hand-painted room with a green armchair by the window', idleCat: 'A cat sitting in the armchair', focusCat: 'A cat keeping you company while you focus' },
  system: {
    storageUnavailable: 'Local storage is unavailable. Check private browsing or storage permissions and try again.', wakeLock: 'This browser cannot keep the screen awake. The timer will continue.', countupShort: 'Count up for at least 10 minutes to finish and earn a gift.', focusComplete: 'Focus complete', hidden: 'Your cat will keep an eye on the time. Come back when you are ready.', initializing: 'The app is still initializing', anotherTab: 'Another tab already has an active focus session', accidentalCancel: 'The accidental focus was cancelled', abandoned: 'Take a break. Your cat saved the crumpled note for you.', notEnoughFish: 'Not enough fish yet. Complete a few more focus sessions.', restored: 'Data restored', reset: 'The starter cottage has been restored', dbUninitialized: 'The database is not initialized', unsupportedData: 'This data file is not supported',
    audioType: 'Choose an MP3, WAV, OGG, M4A, AAC, or FLAC file', audioTooLarge: 'Each audio file must be 50 MB or smaller', audioCount: 'The local audio library can hold up to 5 files', audioTotal: 'Total audio storage cannot exceed 150 MB', audioQuota: 'The browser does not have enough storage for this audio', audioUnsupported: 'This browser cannot play the audio format', audioBlocked: 'The browser blocked playback. Tap to resume.', audioSaved: 'Audio saved locally', audioDeleted: 'Audio deleted',
    notificationBody: (item, fish) => `Your cat brought back ${item}, +${fish} fish`
  },
  starterTasks: { research: 'Complete product research', assets: 'Organize project assets', reading: 'Read for 30 minutes' }
}
