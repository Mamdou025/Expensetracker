import React, {
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  useId,
} from 'react';
import './liquid-glass-nav.css';

/*
 * LiquidGlassNav
 *
 * Props:
 *   items        – [{ label, icon?, href }]   (icon is a ReactNode)
 *   activeIndex  – controlled active index (from parent)
 *   onSelect     – (index, item) => void       (parent handles navigation)
 *   linkAs       – component used to render links (default: 'a')
 *                  pass Link from react-router-dom for SPA routing
 */
const LiquidGlassNav = ({ items = [], activeIndex = 0, onSelect, linkAs: LinkAs = 'a' }) => {
  const uid = useId().replace(/:/g, '');
  const filterId = `lgn-filter-${uid}`;

  const shellRef = useRef(null);
  const blobRef  = useRef(null);
  const itemRefs = useRef([]);

  const [blobStyle, setBlobStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const prevIndexRef = useRef(activeIndex);

  /* Measure one item rect relative to the shell */
  const measureItem = useCallback((index) => {
    const shell = shellRef.current;
    const item  = itemRefs.current[index];
    if (!shell || !item) return null;
    const sr = shell.getBoundingClientRect();
    const ir = item.getBoundingClientRect();
    return {
      left:  ir.left - sr.left,
      width: ir.width,
    };
  }, []);

  /* Move blob to target index, triggering stretch animation */
  const moveBlob = useCallback((toIndex) => {
    const blob = blobRef.current;
    if (!blob) return;

    const from = prevIndexRef.current;
    const goingRight = toIndex > from;

    /* Remove existing animation classes */
    blob.classList.remove('lgn-anim-right', 'lgn-anim-left');

    const measured = measureItem(toIndex);
    if (!measured) return;

    /* Force reflow to restart animation */
    void blob.offsetWidth;

    setBlobStyle({ left: measured.left, width: measured.width, opacity: 1 });
    blob.classList.add(goingRight ? 'lgn-anim-right' : 'lgn-anim-left');

    prevIndexRef.current = toIndex;
  }, [measureItem]);

  /* Initial placement + ResizeObserver to re-place on layout changes */
  useLayoutEffect(() => {
    const measured = measureItem(activeIndex);
    if (measured) {
      setBlobStyle({ left: measured.left, width: measured.width, opacity: 1 });
      prevIndexRef.current = activeIndex;
    }

    const shell = shellRef.current;
    if (!shell) return;

    const ro = new ResizeObserver(() => {
      const m = measureItem(activeIndex);
      if (m) setBlobStyle({ left: m.left, width: m.width, opacity: 1 });
    });
    ro.observe(shell);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Re-move blob whenever activeIndex changes from parent */
  useLayoutEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      moveBlob(activeIndex);
    }
  }, [activeIndex, moveBlob]);

  const handleSelect = (index, item) => {
    if (index !== prevIndexRef.current) moveBlob(index);
    onSelect?.(index, item);
  };

  return (
    <>
      {/* Hidden SVG filter — displacement map for the refraction wobble */}
      <svg className="lgn-svg-filters" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%"
                  colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018 0.025"
              numOctaves="2"
              seed="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="7"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="lgn-shell" ref={shellRef} role="navigation">
        {/* Moving blob */}
        <div
          ref={blobRef}
          className="lgn-blob"
          style={{
            left:   blobStyle.left,
            width:  blobStyle.width,
            opacity: blobStyle.opacity,
            filter: `url(#${filterId})`,
            transition: 'left 0.32s cubic-bezier(0.34,1.06,0.64,1), width 0.32s cubic-bezier(0.34,1.06,0.64,1)',
          }}
        />

        {/* Nav items */}
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const linkProps = LinkAs === 'a'
            ? { href: item.href }
            : { to: item.href };

          return (
            <LinkAs
              key={item.href ?? index}
              ref={(el) => { itemRefs.current[index] = el; }}
              {...linkProps}
              className={`lgn-item${isActive ? ' lgn-active' : ''}`}
              onClick={(e) => {
                /* Don't preventDefault — let router/browser handle navigation */
                handleSelect(index, item);
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{item.icon}</span>}
              {item.label && <span className="hidden sm:inline">{item.label}</span>}
            </LinkAs>
          );
        })}
      </div>
    </>
  );
};

export default LiquidGlassNav;
