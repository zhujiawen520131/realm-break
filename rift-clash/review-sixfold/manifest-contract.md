# 六连审稿页素材契约

美术源由美术代理维护，页面代理不覆盖 `manifest.json`。父代理将实际 PNG 与发布清单合并到此目录。

- `schemaVersion: 1`，`revision: "zenitsu-sixfold-review-1"`，`userApproval: "pending"`。
- `images`: `{ "imageId": { "src": "assets/name.png", "sha256": "64位十六进制内容指纹" } }`。发布清单由父代理添加文件指纹，保留原制作清单。加载 URL 追加短指纹避免旧图缓存。
- `backgrounds`: `{ "forest": "imageId", "overhead": "imageId", "moon": "imageId" }`。
- 实际导演姿态：`crouch`、`face`、`eye`、`sideFace`、`facePullback`、`inflightFace`、`charge`、`overheadReady`、`dash`、`launch`、`finish`、`moon`、`ending`、`roof`。必需特效：`lightning`、`debris`、`trail`、`burst`。
- 每个 clip：`{ "frames": [{ "image": "imageId", "crop": [x,y,w,h], "durationMs": 80 }], "anchor": [0.5,1], "worldHeight": 180 }`。
- `crop` 可省略表示完整图；锚点是裁切后图像的归一化比例。人物帧按当前导演阶段进度分配，帧的时长在此作为相对权重；特效可以按帧时长循环。
- `launch` 是脚底向镜头的蹬发；`moon` 是月下侧背屈膝；`ending` 是俯视空中持刀。三者分开，不循环混合姿态。`overheadReady` 必须能看见头顶与羽织，可引用合适的真实俯视帧。
- `sideFace` 与 `inflightFace` 必须为实际相应视角，不以正脸镜像伪装侧面。近景可以裁满画面。
- `roof` 为透明屋顶四阶段：完整、开裂、中央爆散、洞口残留。导演保持源片的建立镜头与真实穿顶动帧。
- 人物、雷电、浮石、拖尾、爆星、屋顶使用透明背景。`trail` 默认拖尾在左、尖端在右，按轨迹旋转；`lightning` 默认竖直。可给 `trail.rotation` 指定弧度校正。
- `trailCurrent` 为黄白楔形前两帧、`trailResidual` 为青白余迹帧，导演优先各自实际图像；缺别名时才对通用拖尾加色彩滤镜。旧路径降低透明度，不用几何折线代替。场景960×540，像素缩放禁用平滑。
- 所有实际 timeline.pose 引用、背景及特效加载并通过裁切校验后才开放播放；缺项公开显示，不用占位图假装完成。素材帧查看器呈现实际 PNG 裁切。
- 本地审核存储绑定 revision、整个 manifest 与 timeline 的 SHA-256，换帧或改时轴不会继承旧通过结论。

本页只预览演出。六段路径来自参考片可见折线，不代表六次已证实的伤害。合成音效为改编，不复制原片声音。
