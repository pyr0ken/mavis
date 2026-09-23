# Feature Specification: Unified Slash Command Palette & Session History Manager

**Feature Directory**: `specs/005-slash-command-palette`  
**Created**: 2026-09-23  
**Status**: Ready for Planning  

**Input**: User requirement for interactive slash commands and session workflows:
> "قابلیت Slash Command Palette در اینترفیس جزیره/ناچ: با زدن `/` در ورودی ناچ، یک منوی فرمان باز شود شامل دستورات سیستمی (`/new`, `/history`, `/clear`, `/compact`, `/model`, `/settings`)، اسکیلها و MCP با ناوبری کامل کیبورد، فیلتر آنی فازی، اجرای مستقیم اکشنها در UI، و کشوی تاریخچه سشنها (Session History Drawer) با طراحی تاریک و فوقالعاده پریمیوم Raycast/Linear."

---

## Executive Summary & Problem Analysis

Currently, Voice Island operates as a single continuous session inside the notch overlay. When users want to start a fresh conversation, inspect past sessions, clear messages, switch LLM models, or invoke specialized agent skills, there is no direct, low-latency, deterministic control mechanism. Users must either manually delete text or rely on natural language queries, which introduces token latency, non-deterministic model behavior, and lacks quick-action UX.

This feature (`005-slash-command-palette`) introduces a **Unified Slash Command Palette & Session History Engine** directly into the notch input:
1. Typing `/` instantly triggers an obsidian-themed, floating Command Palette with zero latency.
2. Supports grouped categories: **System Commands** (e.g., `/new`, `/history`, `/clear`, `/compact`), **Agent Skills** (e.g., `/skill:review`, `/skill:plan`), and **Integrations & MCP** (`/mcp:status`, `/tools:list`).
3. Fully keyboard-driven with `ArrowUp`/`ArrowDown` item selection, `Enter` to execute, `Tab` to autocomplete, and `Escape` to dismiss.
4. Integrates a **Session History Drawer** that opens smoothly within the notch canvas, allowing users to browse, search, restore, or delete previous conversations stored in local persistence.
5. Provides instant deterministic execution for system commands (0 token cost, 0 API overhead) and prompt injection for skill workflows.

---

## User Scenarios & Acceptance Criteria

### User Story 1 - باز شدن آنی منوی فرمان با زدن اسلش و جستجوی فازی (Priority: P1)

به عنوان کاربر، میخواهم به محض اینکه در ورودی ناچ کاراکتر `/` را تایپ میکنم، یک پالت فرامین شیشهای و شیک (Raycast-style Command Palette) با انیمیشن روان در زیر اینپوت باز شود و با تایپ حروف بعدی فرامین را فیلتر کند، تا بتوانم سریع و بدون فکر کردن به پرامپتهای طولانی، به قابلیتهای اصلی دسترسی پیدا کنم.

**سناریوهای پذیرش**:
1. **هنگامی که** ورودی ناچ خالی است یا کرسر در ابتدای متن است و کاربر کلید `/` را فشار میدهد، **آنگاه** پالت فرامین فوراً (کمتر از 16 میلیثانیه) با استایل Obsidian Frosted Glass زیر نوار ورودی باز میشود.
2. **هنگامی که** کاربر حروفی مثل `hi` یا `ne` را تایپ میکند، **آنگاه** لیست به صورت فازی فیلتر شده و مواردی نظیر `/history` یا `/new` در بالای لیست هایلایت میشوند.
3. **هنگامی که** نتیجهای برای جستجو یافت نمیشود، **آنگاه** پیام مناسب "No matching commands found" با آیکون و راهنما نمایش داده میشود.
4. **هنگامی که** کاربر کلید `Escape` یا `Backspace` روی کاراکتر اول را میزند، **آنگاه** پالت با ترنزیشن فید بسته میشود و اینپوت به حالت عادی بازمیگردد.

---

### User Story 2 - ناوبری روان با کیبورد و اجرای قطعی دستورات (Priority: P1)

به عنوان کاربر، میخواهم با کلیدهای جهتنمای کیبورد (`Up`/`Down`) بین دستورات حرکت کنم و با زدن `Enter` دستور را فوراً اجرا کنم یا با `Tab` نام دستور را داخل اینپوت تکمیل کنم.

**سناریوهای پذیرش**:
1. **هنگامی که** پالت باز است و کاربر کلید `ArrowDown` یا `ArrowUp` را میزند، **آنگاه** آیتم انتخاب شده با حاشیه نئونی ظریف و پسزمینه هایلایت جابجا میشود (با اسکرول خودکار در دید).
2. **هنگامی که** کاربر روی یک دستور (مانند `/new`) کلید `Enter` یا کلیک ماوس را میزند، **آنگاه** اکشن مربوطه بلافاصله اجرا شده، منو بسته شده و ورودی خالی میگردد.
3. **هنگامی که** کاربر کلید `Tab` را میزند، **آنگاه** اسلاگ دستور (مثلاً `/model `) در اینپوت قرار گرفته و پالت متناسب با آن بهروزرسانی یا بسته میشود.

---

### User Story 3 - شروع سشن تازه (`/new`) و پاکسازی (`/clear`) (Priority: P1)

به عنوان کاربر، میخواهم با دستور `/new` کل مکالمه فعلی و حالت تفکر/ابزارها ریست شود و یک سشن جدید آغاز گردد، و با `/clear` صفحه چت جاری پاک شود.

**سناریوهای پذیرش**:
1. **هنگامی که** دستور `/new` انتخاب یا ارسال میشود، **آنگاه** سشن جاری در تاریخچه آرشیو شده، لیست پیامها خالی شده، وضعیت تفکر/ابزارها ریست شده و یک کپسول پیام "New session started" موقتاً نمایش داده میشود.
2. **هنگامی که** دستور `/clear` اجرا میشود، **آنگاه** پیامهای نمایش داده شده در بوم فعلی پاک میشوند اما آیدی سشن حفظ میگردد.

---

### User Story 4 - کشوی تاریخچه سشنها و تعویض گفتگوها (`/history`) (Priority: P2)

به عنوان کاربر، میخواهم با دستور `/history` کشو/لیست سشنهای قبلی باز شود تا بتوانم مکالمات قبلی را مرور، جستجو، لود یا حذف کنم.

**سناریوهای پذیرش**:
1. **هنگامی که** دستور `/history` اجرا میشود، **آنگاه** نمای تاریخچه (History Drawer / View) در بوم ناچ باز میشود و لیستی از سشنهای قبلی با تاریخ، عنوان خلاصه و تعداد پیامها نمایش داده میشود.
2. **هنگامی که** کاربر روی یک سشن در تاریخچه کلیک میکند، **آنگاه** پیامهای آن سشن مجدداً در بوم چت بارگذاری شده و نمای تاریخچه به نمای اصلی سوئیچ میکند.
3. **هنگامی که** کاربر روی آیکون حذف یک سشن کلیک میکند، **آنگاه** آن سشن از حافظه پایدار محلی حذف میگردد.

---

### User Story 5 - اسکیلها و دستورات ابزارها/MCP (`/skill:...`, `/mcp:status`, `/model`) (Priority: P2)

به عنوان کاربر، میخواهم بتوانم با فرامین اسکیل پرامپتهای ساختاریافته (مثل Review, Plan) را به مدل بفرستم و وضعیت MCP یا مدل فعال را مدیریت کنم.

**سناریوهای پذیرش**:
1. **هنگامی که** دستور `/skill:review` انتخاب میشود، **آنگاه** پرامپت آماده اسکیل کد ریویو در ورودی قرار میگیرد یا به عنوان سیستم پرامپت موقت تزریق میشود.
2. **هنگامی که** دستور `/compact` اجرا میشود، **آنگاه** دستیار پیامی برای خلاصهسازی و کاهش توکن ارسال میکند.
3. **هنگامی که** دستور `/model` فراخوانی میشود، **آنگاه** انتخابگر مدلها ظاهر میشود.

---

## Non-Functional Requirements & Performance

1. **Latency & Responsiveness**: پاپآپ پالت فرامین باید در کمتر از ۱۶ میلیثانیه باز شود و فیلتر فازی بدون لگ (0ms debounce برای لیست محلی) کار کند.
2. **Zero Memory Leak**: تمام لیسنرهای کیبورد و استیتهای فیلتر هنگام بسته شدن کامپوننت پاکسازی شوند.
3. **Visual Cohesion**: استفاده دقیق از پالت رنگی Obsidian (`#000000` / `#0b0f19` / `rgba(255, 255, 255, 0.08)` hairline border)، فونت هماهنگ، آیکونهای واضح و بج دستهبندی.
4. **Persistence**: ذخیرهسازی سشنها و تاریخچه در Storage محلی (LocalStorage / SQLite) به صورت ساختاریافته و سبک.

---

## Assumptions & Dependencies

- ورودی اصلی ناچ در `NotchContainer.tsx` به عنوان نقطه مرکزی دریافت کاراکتر `/` استفاده میشود.
- کتابخانه آیکونهای `lucide-react` در پروژه موجود است.
- ترنزیشنها با Tailwind و CSS فریمورک انیمیشنهای ناچ هماهنگ خواهند بود.
