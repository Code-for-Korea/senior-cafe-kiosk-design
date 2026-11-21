# Custom order-method icons

Order-method assets, updated 2026-10-13. These are distinct from exported NIA/Figma system assets.

- dineIn.svg: user-provided Dine-in.svg mug. Original path and 384×384 viewBox retained; Illustrator metadata omitted. The source file is unchanged.
- takeOut.svg: original handled takeaway bag created for this kiosk on 2026-10-10. Its internal drawing is scaled to 77% about the center of its unchanged 32px frame. The user requested a 10% enlargement from the previous 70% version for optical balance. At a 176px icon slot, mug height ≈107.65px and bag height118.58px; surrounding layout is unchanged.

Original black SVGs are used as alpha masks by Icon.tsx so the caller supplies gold, neutral, selected or high-contrast colors. Both icons share this component across standard/low method screens and the order-method dialog.
