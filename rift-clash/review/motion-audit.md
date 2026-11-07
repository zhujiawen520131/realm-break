# R3 动作与机制独立复核

日期：2026-11-07（Asia/Shanghai）。本批是对用户明确指出的「挥砍像刺击、技能缺少转体、劳拉持枪普攻却搏击」的修正。R2文件数、透明通道和裁切合格不能证明动作自然，本次不沿用该结论作为动作质量通过。

## 判定依据

逐组按八个姿态的顺序检查，而非把单张漂亮姿势当成完整动作：

1. **武器轨迹与动作类别**：挥砍应有刃尖从身后或上侧绕经攻击平面、越过接触点、落到另一侧的连续轨迹；刺击、拔刀瞬切与射击各自判断，不将真实刺棍强改旋转斩。
2. **身体传力**：脚掌支撑或蹬地、髋部转动、胸肩随动、手臂/武器滞后与超越、恢复支撑可被看出。仅摆动武器或加光弧不算修正。
3. **可读的时间结构**：蓄力、加速、接触、惯性随动、减速和收招不能全部同速。八张关键姿态仍不等于补齐全部中间帧。
4. **解剖与连续性**：手脚数量、握持手、肩肘关节、衣服/武器体积保持合理；允许转背和前后三分之四角度，不能以「朝右」锁死躯干侧面。
5. **射击一致性**：枪口方向与弹道一致，击发有腕/肩后坐，后续瞄准重新回正；弓弦、投掷手、步枪枪托和双枪分别判断。
6. **几何检查仅为基础**：透明、裁切、相邻格不串入、脚底与身体尺度可支持预览，但不单独构成动作通过。

## 证据范围

动作研究代理负责官方来源和实际视频抽帧，研究记录保存在 `motion-study/`；未实际看过的片段不得写成已逐帧核验。生成稿的具体视觉发现、退回项和剩余限制将在下面逐组记录。

## 当前状态与证据纠正

32组动作已逐组看过，每组8个关键姿态。动作方向草案复核完成，31组标为方向通过、德雷克普攻一段保留前后手一二拳的明确限制；“动作方向通过”仅表示解决本轮关键问题，不能代替用户批准，也不等于完整自然动画。具体源文件 SHA 与待修正项见同目录 `review-findings.json`。

审核曾发现所谓克劳德视频切片实际含尤菲/斯卡蕾特，已要求研究代理纠正。当前克劳德仅采用官方静态挥砍关键姿势，八帧编排与时序明确属于创作；不再声称是克劳德实机连续抽帧。劳拉双枪、悟空横扫有实际官方视频片段；德雷克救援镜头是山姆，不作为本人拳击证据；鬼灭动作仅有官方静态参考，未把无法访问的视频说成已看过。

## 劳拉射击机制复核

独立阅读新机制并重新运行 `tests/lara-shooting.cjs`，11项检查通过：普攻只发射真实弹体而无近战判定、有限射程、三段输入衔接及第三段收招、持续正面格挡、瞬移换边后的弹道方向、旧弹体不能确认新招式、上挑射击、正常跳跃顶点向地面射击、命中停顿/海报冻结，以及近距离双向互射。

初版空中射击下落速度不足，正常跳跃顶点无法在射程内命中地面目标。已改为固定向下速度12、水平23、射程360，并用真实跳跃后的命中检查验证，没有增加自动寻敌。第三段是一枚较强子弹，名称改为“终结点射”。

临时整身程序枪击绘制会让手绘待机突然变简单几何，此问题已要求移除。现在采用独立预览页的可选手绘动作挂钩，并独立运行最终24项预览模块检查，覆盖资源优先级、接触姿态、战斗时钟冻结和不以程序旋转整个人物。正式版暂不替换。上挑与空射须使用新增专用八姿态图，不以水平枪击借帧当最终完成。

## 时序和特效对齐建议

- 劳拉普攻前摇分别7/7/10tick，挑空10、空射6；前四个蓄势姿态压缩于前摇内，枪火接触姿态在弹体实际生成tick显示。接触后短促后坐，再分配回正与收招；不能将八帧均匀铺满导致枪火晚于子弹。
- 劳拉普攻的真实三段输入可在前两枪生成8tick后无命中续接，第三枪仍有收招；视觉也应能从重新瞄准衔接下一枪，而不是强制等完整慢速展示结束。
- 德雷克必杀首次枪火是第4姿态，eventFrame=3（零基）；运行时用[3,4,6]随实际7tick射击周期循环，跳过自带第二次火光的第6姿态，避免无弹假开火。审核画廊仍保留完整八张。
- 克劳德必杀新图第一记下斩在第3姿态、第二记反斩在第6姿态。当前引擎必杀只有前摇结束时一次direct230/39伤害，后续反斩只是画面随动，不声称双命中，也不增加伤害。不可套默认第5姿态作为首次接触；反斩5→6仍缺中间动作，需强调是关键姿态草案。
- 炭治郎水车建议局部垂直偏移[0,-35,-85,-120,-80,-45,0,0]并在预览保留偏移，约48px最高视觉抬升。它是画面里的翻滚弧线，不是新增物理跳跃；不得改变真实判定或以整人旋转伪造动作。
- 命中停顿冻结动画与特效同一战斗时钟；华丽刀光应跟随真实武器方向，不可遮住握持错乱。当前Node检查不证明实机手感已通过。

## 逐组视觉复核记录

以下为实际源图顺序检查结果，自动生成于同目录JSON，未到的组保持待审。

| 角色 / 动作 | 状态 | 可见证据与限制 |
|---|---|---|
| cloud / attack1 | PASS_DRAFT_CHOREOGRAPHY | High-to-low slash: back-loaded 1–3, over-crown4, diagonal contact5, low followthrough6–7. Similar anticipation2–3 is acceptable, not eight forward pushes. |
| cloud / attack2 | PASS_DRAFT_CHOREOGRAPHY | Regenerated after rejection: contact4–5 now crosses chest6 and turns behind the body7. Original candidate repeated forward push6–7 and was rejected. New direction passes; sparse transition still needs playback polish. |
| cloud / attack3 | PASS_DRAFT_CHOREOGRAPHY | Overhead3, vertical acceleration4, low contact5, compression6 and settle7 read as heavy chop. Similar low5–7 should represent absorption, not three repeated hits. |
| cloud / skill | PASS_DRAFT_CHOREOGRAPHY | Low backload1–3 unwinds into rising cut4–5 and travels above/behind shoulder6–7. Similar2–3 is anticipation; not a forward thrust. |
| cloud / ultimate | PASS_DRAFT_CHOREOGRAPHY | Regenerated low-right5 to opposite high shoulder6 and rear torso7 removes rejected upward-point finish. First downward contact is pose3; reverse slash pose6. Major missing intermediate between5–6 remains, so only draft direction passes. |
| lara / attack1 | PASS_DRAFT_CHOREOGRAPHY | Targeted recoil correction passes: pose6 keeps arm nearly extended, modest muzzle rise and chest absorption instead of severe elbow collapse. Aim4→flash5→recoil6→reacquire7 clearly depicts shooting. |
| lara / attack2 | PASS_DRAFT_CHOREOGRAPHY | Controlled lead-arm shot with flash5 then recoil6 and re-aim7. Pose6 still lifts muzzle around20–25 degrees and is more exaggerated than corrected attack1; polish limitation, not a melee/thrust or limb-swap blocker. Alternating hands not required by single-bullet mechanics. |
| lara / attack3 | PASS_DRAFT_CHOREOGRAPHY | One strong shot flash5, recoil6, re-aim7 and lowering8 matches one-finisher-bullet logic. Second gun in pose2 is largely occluded, not clearly an extra/missing arm. |
| lara / skill | PASS_DRAFT_CHOREOGRAPHY | Arrow nock2, draw3, cheek anchor4, release5 with draw hand back, extended bow followthrough6 and lowering7–8. Grounded feet are appropriate. Upper bow tip gutter is tight. |
| lara / ultimate | PASS_DRAFT_CHOREOGRAPHY | Shooting volley intent is clear, but poses3–6 all have baked muzzle flashes and recoil differences are weak. Runtime should emit flash pose3 only on actual shot ticks and use nonflash7/8 between shots. Alternation of left/right gun is not a requirement; do not claim six uniquely drawn recoil cycles. |
| lara / launcher | PASS_DRAFT_CHOREOGRAPHY | Grounded brace raises firing hand for upward shot5; barrel rises about10 degrees, broadly matching fixed vy-4/vx19 trajectory. Recoil6 is a little steeper, then7 returns to aim; no whole-body rotation hack. |
| lara / air | PASS_DRAFT_CHOREOGRAPHY | Tucked airborne pose aims gun down-right, flash5, short recoil6 and reacquire7. Barrel appears roughly30–35 degrees versus logical27.5 degrees; close direction match with residual angle calibration. Jump itself remains engine physics. |
| wukong / attack1 | PASS_DRAFT_CHOREOGRAPHY | Staff changes diagonal→vertical load→foreshortened acceleration4→horizontal contact5→far-side low followthrough6–7 with visible back rotation. Implied shaft foreshortening remains uneven. |
| wukong / attack2 | PASS_DRAFT_CHOREOGRAPHY | Broad torso/back rotation3–5 carries staff around waist then rises6–8. Horizontal early shaft is part of horizontal sweep, not forward push. Some occluded grip detail remains ambiguous. |
| wukong / attack3 | PASS_DRAFT_CHOREOGRAPHY | Overhead3–4 descends diagonally across front5, then low sinking6–7. Different contact direction from forward-projected ultimate, though shared anticipation silhouette remains. |
| wukong / skill | PASS_DRAFT_CHOREOGRAPHY | Back-three-quarter coil2–3 unwinds into lunge/finger cast5 then retract7. Planted staff and casting hand are legible; this is a cast, not a melee strike. |
| wukong / ultimate | PASS_DRAFT_CHOREOGRAPHY | Overhead windup3 descends through4 to projected contact5 then low crouched followthrough6–7. Forward staff at contact is part of descending arc. Grip/foreshortening transition remains sparse; frame5 needs adaptive gutter extraction. |
| drake / attack1 | PASS_DRAFT_WITH_LIMITATION | Visible pose4 is a lead/watch-hand straight and pose5 a rear straight. This can read as a one-two action, not eight poses of the same single right punch. Runtime still applies one hit; do not claim two damage events. Weight transfer and torso rotation are visible. |
| drake / attack2 | PASS_DRAFT_CHOREOGRAPHY | Rear coil2–3, open-shoulder acceleration4, right hook contact5 and turned followthrough6, guard7–8. Right punch and left/watch guard remain consistent; passes draft force transfer. |
| drake / attack3 | PASS_DRAFT_CHOREOGRAPHY | Targeted candidate c541afb5 fixes the rejected pose5: three-quarter back view with RIGHT elbow forward and LEFT/watch hand down behind, continuous with4/6. Previous left-elbow swap was explicitly rejected. Remaining middle poses have limited torso-angle variety, so this is draft continuity, not complete realism. |
| drake / skill | PASS_DRAFT_CHOREOGRAPHY | Grenade rear load2–3, trunk/shoulder rotation4, release5 and arm-down weight absorption6. Actual projectile should leave on pose5; overhead hand has tight top gutter. |
| drake / ultimate | PASS_DRAFT_CHOREOGRAPHY | Shoulder-braced rifle with supporting hand under fore-end; flash4 and6 alternate with level re-aim5/7. First event is pose4, not5. Runtime [3,4,6] zero-index active cycle avoids extra baked flash6 between actual shots. |
| tanjiro / attack1 | PASS_DRAFT_CHOREOGRAPHY | Back load2–3, open-chest waist cut4–5, cross-body step6, down arc7 and low recovery8. Frame5 blade crosses nominal cell boundary but transparent gap separates next figure. |
| tanjiro / attack2 | PASS_DRAFT_CHOREOGRAPHY | Low rear load1–2 rises through4–5 and continues over shoulder6–8. Ends in high guard suitable to chain attack3; standalone idle return still needs transition. |
| tanjiro / attack3 | PASS_DRAFT_CHOREOGRAPHY | Back-facing coil3, step4, downward slash5–6, cross-body low finish7. Blade/hip orientations show actual cutting; sparse acceleration4→5 requires timing polish. |
| tanjiro / skill | PASS_DRAFT_CHOREOGRAPHY | Crouch→coil→horizontal airborne→full inversion→rotation→landing shows whole-body Water Wheel direction. No obvious extra limbs. Eight poses still need anchor/timing review, not rigid-body rotation. |
| tanjiro / ultimate | PASS_DRAFT_CHOREOGRAPHY | Overhead2→descending cut3→low4→ascending5→overhead follow6→low7→guard8. Four-hit runtime needs scheduled contact alignment;6→7 could look like another cut if effects added. Pale blade fringe still requires native compositing QA. |
| zenitsu / attack1 | PASS_DRAFT_CHOREOGRAPHY | Sheathed load, back-three-quarter coil2, draw3–4, waist cut5, downward followthrough6–7 and high recovery8. Scabbard becomes occluded/indistinct in middle poses; return is drawn guard rather than complete resheathing. |
| zenitsu / attack2 | PASS_DRAFT_CHOREOGRAPHY | Rear coil2–3→low cross-body4→rising cut5→overhead settle6–8. Last three poses are similar guard, not more impacts. Scabbard/grip occlusion remains in middle poses. |
| zenitsu / attack3 | PASS_DRAFT_CHOREOGRAPHY | Back-shoulder load2–3 turns into downward cut4, lower crossed-arm followthrough5 and sinking6–7. Missing acceleration is3→4; 4→5 is deceleration, not another hit. Top blade tip margin is tight. |
| zenitsu / skill | PASS_DRAFT_CHOREOGRAPHY | Sheathed crouch→weight shift→draw→low strike→blade across front→back-three-quarter followthrough→brake→resheath. Insertion between7–8 remains underspecified. |
| zenitsu / ultimate | PASS_DRAFT_CHOREOGRAPHY | Draw3→cut4→low follow5→reload6→second cut7→settle8. Two clear strike directions but sparse transitions. Runtime six-hit schedule needs alternating contact indices3 and6 rather than uniform eight-frame playback. |

## 实际浏览器与现有效果复核

使用本地 Chromium 打开独立R3预览、载入手绘动作，捕获 `audit-tanjiro-skill-{11,16,23}.png`、`audit-zenitsu-ultimate-24.png` 与 `audit-lara-air-7.png`，无页面JavaScript错误。截图记录的是当前构建快照，不等于最终全角色交互手感通过。

水车特效原本固定生成于x437.496，角色在第11/16/23tick分别移动到x364/399/430.68，视觉中心在初期明显偏到身体前方。已在源app中修正为仅R3页面跟随施法者位置、锁定施放方向与局部翻滚抬升；已在最新构建再次截图核实，轮弧围绕身体并随局部跃起，原本固定在前方的问题已消除。它依然是程序椭圆水弧，不是依据每帧刀尖/骨骼重建的水流，不能宣称特效全部重做。

善逸雷光是攻击发生时留下的固定空间轨迹，作为残影合理；不是对手位置追踪。现有水龙、棍波、交叉斩等仍是旧的程序特效，本轮主要修接触时序与动作。角色八帧里的视觉反斩和枪火必须按真实判定调度；克劳德必杀后半反斩不增加伤害，劳拉必杀不能在无子弹tick一直显示烘焙枪火。

最终复拍同时验证空中射击反馈：旧构建枪火在胸口且朝横向，新构建弹体与shot事件共享校准枪口，反馈绘制采用锁定朝向镜像和局部弹道角。`audit-lara-air-7.png`显示枪火位于下瞄枪口且与弹体方向一致。独立重跑`tests/motion-preview.cjs`最终24项通过；近距枪管占据段与R3弹体160高命中范围属于机制代理的配套修改，不能将截图当作所有碰撞边界的证明。

本轮的明确退回历史包括：克劳德二段斩仍像推刺、克劳德必杀第二刀只向上指、劳拉第一枪过大折肘后坐、德雷克肘击中途左右手交换。各项均先指出具体姿态，再检查修正稿；德雷克肘击最终c541afb5稿保持右肘与左腕表手连续，前两次失败未被放行。仍保留的草案局限包括刀棍透视与握持的细节跳变、少量相似蓄势/收招、缺乏全套中间帧、劳拉必杀后坐区分弱及德雷克第一招一二拳语义。审核完成不等于用户已批准32组，不宣称“全部动作已经真实流畅”。
