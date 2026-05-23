import dayjs from "dayjs";
import dayjsBusinessDays from "dayjs-business-days2";

dayjs.extend(dayjsBusinessDays);

export interface DutyGroup {
  members: string[];
}

const DUTY_GROUPS: DutyGroup[] = [
  { members: ["朱辰"] },              // 第 1 周 周一
  { members: ["郑泽涵"] },            // 第 1 周 周二
  { members: ["赵嘉彤", "马瑞骐"] },  // 第 1 周 周三
  { members: ["余卓霏", "魏思霖"] },  // 第 1 周 周四
  { members: ["沈欣怡", "巩沛铭"] },  // 第 1 周 周五
  { members: ["尚湉湉", "李颜汐"] },  // 第 2 周 周一
  { members: ["李函菲", "钟雨珊"] },  // 第 2 周 周二
  { members: ["张俊哲", "沈默"] },    // 第 2 周 周三
  { members: ["徐文浩", "王鹏云"] },  // 第 2 周 周四
  { members: ["王士涵", "刘艺泽"] },  // 第 2 周 周五
  { members: ["温睿杰", "李轩宁"] },  // 第 3 周 周一
  { members: ["宋思咏", "马浩哲"] },  // 第 3 周 周二
  { members: ["梁承浩", "宫紫卿"] },  // 第 3 周 周三
  { members: ["李湘淮", "李牧其"] },  // 第 3 周 周四
  { members: ["冯子宸"] },            // 第 3 周 周五
];

const WEEKDAY_LABELS = ["周一", "周二", "周三", "周四", "周五"] as const;

const CYCLE_START_MON = dayjs("2026-05-04");

// type WeekIdx = 1 | 2 | 3;
// type CycleIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type WeekIdx = number;
type CycleIdx = number;

function cycleIdx(date: dayjs.Dayjs): CycleIdx {
  return (CYCLE_START_MON.businessDiff(date) % 15) as CycleIdx;
}

export interface DutyInfo {
  group: DutyGroup;
  weekdayLabel: typeof WEEKDAY_LABELS[number];
  weekIndex: WeekIdx;  // 1-based
  groupIndex: CycleIdx;
}

export function getDutyInfo(date: dayjs.Dayjs): DutyInfo | null {
  const dow = date.day(); // 0=Sun
  if (dow === 0 || dow === 6) return null; // 周末

  const n = cycleIdx(date);

  return {
    group: DUTY_GROUPS[n],
    weekdayLabel: WEEKDAY_LABELS[dow - 1],
    weekIndex: (Math.floor(n / 5) % 3) + 1 as WeekIdx,
    groupIndex: n,
  };
}

export function getTodayDutyInfo(): DutyInfo | null {
  const now = dayjs();
  const dow = now.day(); // 0=Sun
  if (dow === 0 || dow === 6) return null; // 周末

  const n = cycleIdx(now);
  const dayOffset = dow - 1; // 0=Mon…4=Fri

  return {
    group: DUTY_GROUPS[n],
    weekdayLabel: WEEKDAY_LABELS[dayOffset],
    weekIndex: Math.floor(n / 5) + 1,
    groupIndex: n,
  };
}

export function getNextDutyInfo(): DutyInfo | null {
  const now = dayjs();
  const next = now.nextBusinessDay();

  const n = cycleIdx(next);
  const dayOffset = next.day() - 1;

  return {
    group: DUTY_GROUPS[n],
    weekdayLabel: WEEKDAY_LABELS[dayOffset],
    weekIndex: Math.floor(n / 5) + 1,
    groupIndex: n,
  };
}
