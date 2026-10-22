# Feature Specification: Ambient Todo Island & Keyboard-Driven Action Card

**Feature Directory**: `specs/006-ambient-todo-island`  
**Created**: 2026-10-04  
**Status**: Ready for Planning  

**Input**: User requirement for an exclusive, hyper-polished Todo experience:
> "یه بخش به اسم todo میخوام اضافه بکنم ولی یه تودو لیست خاص و اختصاصی خفن و جذاب برای خودم باشه. رویکرد اول (Native & Ultra-Fast Local) رو میخوام و همینطور هر دو Ambient Notch 'Now Doing' (مشابه Live Activities اپل) و Action Card کیبورد-محور به سبک Linear / Raycast رو هم میخوام."

---

## Executive Summary & Problem Analysis

In modern desktop multitasking, managing immediate engineering tasks and maintaining deep focus typically requires switching away to heavyweight task managers or browser tabs. This context switching disrupts developer flow and mental state.

Currently, Mavis possesses dynamic notch morphing and unified action cards for messaging and calendar intents, but lacks a dedicated task execution and focus workflow.

This feature (`006-ambient-todo-island`) introduces a **two-tier native task management experience**:

1. **Ambient Notch "Now Doing" (Apple Live Activity Style)**:
   - When a task is actively in progress, the collapsed/idle notch (`400px x 54px`) transforms into an ambient focus display.
   - Shows a subtle pulsing target icon, the active task title, and a live elapsed timer (`🎯 Task Name [18m]`).
   - Features a one-click / hotkey quick-complete action that triggers Mavis's physical spring success capsule and auto-retracts.

2. **Linear / Raycast Keyboard-Driven Action Card (`/todo`)**:
   - Expanding the notch into the action canvas reveals a dark, ultra-minimalist Todo management surface.
   - Full vim-inspired keyboard navigation (`j`/`k` or `Up`/`Down`, `Space` to toggle complete, `d` or `Enter` to start Doing, `1`/`2`/`3` to set Priority).
   - Natural language task input with automatic token parsing (e.g., `Fix proxy socket p1 #oxiroute`).
   - Instant local persistence with zero latency and zero external network dependencies.

---

## User Scenarios & Acceptance Criteria

### User Story 1 - نمایش تسک فعال در ناچ به سبک Live Activity (Priority: P1)

به عنوان کاربر در حین کدنویسی و کار در دسکتاپ، می‌خواهم وقتی تسکی را در وضعیت «در حال انجام» (In Progress / Now Doing) قرار می‌دهم، ناچ بسته به صورت امبینت و نامحسوس تسک جاری و زمان سپری‌شده را نمایش دهد، تا همواره بدون نیاز به باز کردن برنامه‌های دیگر روی هدف اصلی فوکوس داشته باشم و زمان را حس کنم.

**سناریوهای پذیرش**:
1. **هنگامی که** یک تسک در وضعیت `in_progress` قرار می‌گیرد، **آنگاه** ناچ در حالت `idle` از حالت ورودی ساده به ویجت زنده تغییر می‌کند: آیکون هدف پالس‌دار در چپ، عنوان تسک و زمان زنده سپری‌شده در وسط (مثلاً `[14m]`)، و دکمه تیک سریع در راست.
2. **هنگامی که** روی دکمه تیک سریع یا شورتکات تکمیل تسک زده می‌شود، **آنگاه** تسک به وضعیت `done` تغییر یافته، کپسول موفقیت سبز رنگ Mavis با پیام تبریک ظاهر شده و سپس ناچ به حالت عادی جمع می‌شود.
3. **هنگامی که** هیچ تسکی در وضعیت `in_progress` نیست، **آنگاه** ناچ ظاهر پیش‌فرض خود را با آواتار و پلیس‌هولدر انیمیشنی حفظ می‌کند.
4. **هنگامی که** کاربر روی ناحیه متن تسک جاری کلیک می‌کند، **آنگاه** اکشن کارت کامل `/todo` باز می‌شود تا جزئیات تسک‌ها را مشاهده یا ویرایش کند.

---

### User Story 2 - کارت اکشن تمام‌عیار و کیبورد-محور تودولیست به سبک Linear / Raycast (Priority: P1)

به عنوان کاربر علاقه‌مند به کاربری سریع با کیبورد، می‌خواهم با زدن فرمان `/todo` یا کلید میانبر `Ctrl+T`، کارت اکشن تودولیست با طراحی تیره، متراکم و زیبا در بوم ناچ باز شود و بتوانم تمام کارها را فقط با کلیدهای کیبورد مدیریت کنم.

**سناریوهای پذیرش**:
1. **هنگامی که** کاربر عبارت `/todo` را در ورودی ناچ تایپ یا انتخاب می‌کند یا کلید میانبر را می‌زند، **آنگاه** بوم ناچ به اندازه کارت اکشن (`860px x 480px`) باز شده و لیست تسک‌ها با تب‌های فیلتر و ردیف‌های منظم به نمایش درمی‌آید.
2. **هنگامی که** کاربر کلیدهای `j` یا `k` (یا `Down`/`Up`) را فشار می‌دهد، **آنگاه** فوکوس بین ردیف‌های تسک‌ها با هایلایت ظریف جابجا می‌شود.
3. **هنگامی که** کاربر کلید `Space` را روی یک تسک می‌زند، **آنگاه** وضعیت تسک بین انجام‌نشده و انجام‌شده تغییر می‌کند.
4. **هنگامی که** کاربر کلید `Enter` یا `d` را روی یک تسک می‌زند، **آنگاه** آن تسک به عنوان تسک فعال (`in_progress` / Now Doing) علامت‌گذاری شده و تسک قبلی در صورت وجود از حالت انجام متوقف می‌شود.
5. **هنگامی که** کلیدهای `1`، `2`، `3` یا `0` فشرده می‌شوند، **آنگاه** اولویت تسک به ترتیب به P1 (فوری/قرمز)، P2 (متوسط/نارنجی)، P3 (عادی/آبی) یا None تنظیم می‌شود.
6. **هنگامی که** کلید `Delete` یا `Backspace` فشرده می‌شود، **آنگاه** تسک انتخاب‌شده با یک انیمیشن نرم حذف می‌شود.

---

### User Story 3 - ورودی سریع وظایف با پردازش زبان طبیعی (Quick Natural Input) (Priority: P1)

به عنوان کاربر، می‌خواهم بتوانم در بالای کارت تودولیست فوراً یک تسک جدید تایپ کنم و سیستم به صورت هوشمند اولویت و تگ‌ها را تشخیص دهد (مانند `Fix proxy latency p1 #oxiroute`)، تا ثبت وظایف کمتر از ۲ ثانیه طول بکشد.

**سناریوهای پذیرش**:
1. **هنگامی که** کاربر در فیلد ورودی بالای لیست تایپ می‌کند و `Enter` می‌زند، **آنگاه** تسک جدید بلافاصله با اولویت استخراج‌شده (در صورت وجود `p1` یا `p2` یا `p3`) و تگ‌های مشخص‌شده (مثل `#tag`) ایجاد و در صدر لیست ذخیره می‌شود.
2. **هنگامی که** تسک جدید افزوده می‌شود، **آنگاه** فیلد ورودی خالی شده و ردیف تسک جدید با یک فلش نوری ملایم در بالای لیست قرار می‌گیرد.

---

### User Story 4 - ذخیره‌سازی محلی پایدار و صفر تاخیر (Instant Local Persistence) (Priority: P1)

به عنوان کاربر، می‌خواهم تسک‌ها، وضعیت Now Doing و تایمرهای من به صورت محلی ذخیره شوند و با بستن یا باز کردن مجدد برنامه یا ریست سیستم از بین نروند.

**سناریوهای پذیرش**:
1. **هنگامی که** هر تغییری در تسک‌ها (ایجاد، تغییر وضعیت، حذف، اولویت) اعمال می‌شود، **آنگاه** بلافاصله در حافظه پایدار محلی ثبت می‌شود.
2. **هنگامی که** برنامه اجرا می‌شود، **آنگاه** در صورت وجود تسک در حال انجام، مدت زمان سپری‌شده بر اساس زمان شروع (`doingStartedAt`) محاسبه شده و تایمر بدون انحراف ادامه می‌یابد.

---

### User Story 5 - ادغام با فرامین اسلش و هاب داشبورد (Priority: P2)

به عنوان کاربر، می‌خواهم تودولیست هم در پالت اسلش کامند (`/todo`) و هم در هاب داشبورد ناچ به عنوان یک ویجت دسترسی سریع حضور داشته باشد.

**سناریوهای پذیرش**:
1. **هنگامی که** پالت اسلش با زدن `/` باز می‌شود، **آنگاه** فرمان `/todo` با آیکون چک‌لیست و توضیحات در دسته workflow/system در دسترس باشد.
2. **هنگامی که** کاربر به داشبورد هاب اصلی ناچ نگاه می‌کند، **آنگاه** یک کارت ابزار سریع به نام `Todo List` همراه با شمارنده تسک‌های باز و تسک جاری نمایش داده شود که با کلیک، کارت تودو را باز کند.

---

## Key Entities & Data Model

- **TodoItem**:
  - `id`: شناسه یکتا (رشته)
  - `title`: متن تسک (رشته)
  - `status`: وضعیت تسک (`todo` | `in_progress` | `done`)
  - `priority`: اولویت تسک (`p1` | `p2` | `p3` | `none`)
  - `tags`: برچسب‌های تسک (آرایه رشته)
  - `createdAt`: زمان ساخت (میلی‌ثانیه)
  - `completedAt`: زمان تکمیل (اختیاری)
  - `doingStartedAt`: زمان شروع فعالیت زنده جهت محاسبه تایمر زنده (اختیاری)

- **TodoFilter**:
  - فیلتر فعال در کارت اکشن (`all` | `active` | `doing` | `done` | `p1`)

---

## Success Criteria (Measurable & Technology-Agnostic)

1. **سرعت دسترسی**: باز شدن کارت تودولیست از هر نقطه‌ای با میانبر کیبورد در کمتر از ۵۰ میلی‌ثانیه.
2. **سرعت ثبت تسک**: کاربر بتواند یک تسک جدید را با کیبورد در کمتر از ۲ ثانیه ایجاد کند.
3. **وضوح امبینت در ناچ**: در زمان فعال بودن تسک، کاربر بدون هیچ کلیک اضافه‌ای با یک نگاه به ناچ بتواند نام کار جاری و مدت زمان را تشخیص دهد.
4. **پایداری ۱۰۰٪ داده‌ها**: هیچ تسکی با ری‌استارت پنجره یا برنامه از دست نرود و محاسبات تایمر دقیق بماند.
5. **ارگونومی کیبورد**: ۹۵٪ عملیات روزمره (تیک زدن، شروع فوکوس، تغییر اولویت، ناوبری، حذف) بدون نیاز به دست زدن به ماوس قابل انجام باشد.

---

## Non-Functional Requirements & Design Aesthetics

- **Dark Elegance**: استفاده دقیق از طراحی تیره مات (`#000000` / `#0b0f19`)، بردرهای مویی (`border-white/10`) و رنگ‌های اولویت متمایز (P1: سرخ نئونی، P2: کهربایی، P3: آبی آسمانی).
- **Zero Memory Leak**: تایمرهای ثانیه‌شمار مربوط به Now Doing در هنگام جمع شدن یا باز شدن مدیریت شده و مصرف CPU زیر 0.1% بماند.
- **Micro-Interactions**: فید و اسپرینگ نرم در چک خوردن تسک‌ها با هماهنگی کامل سیستم انیمیشن ناچ Mavis.
