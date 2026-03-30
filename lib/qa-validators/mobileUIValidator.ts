/**
 * Mobile UI QA Validator
 * 
 * Reviews screen output for mobile usability issues:
 * - Horizontal scroll
 * - Text overflow
 * - Clipped content
 * - Spacing issues
 * 
 * Returns bug list with severity and fix recommendations
 */

export interface MobileUIBug {
  severity: 'Critical' | 'High' | 'Medium';
  issue: string;
  location: string;
  likelyCause: string;
  fix: string;
}

export interface MobileUIValidationResult {
  passed: boolean;
  bugs: MobileUIBug[];
  summary: {
    critical: number;
    high: number;
    medium: number;
  };
}

export class MobileUIValidator {
  private bugs: MobileUIBug[] = [];

  /**
   * Validate a component for mobile usability
   */
  validate(element: HTMLElement, targetWidth: number = 375): MobileUIValidationResult {
    this.bugs = [];

    // Check for horizontal scrolling
    this.checkHorizontalScroll(element);

    // Check for text overflow
    this.checkTextOverflow(element);

    // Check for clipped content
    this.checkClippedContent(element);

    // Check spacing issues
    this.checkSpacingIssues(element);

    // Check viewport constraints
    this.checkViewportConstraints(element, targetWidth);

    const summary = {
      critical: this.bugs.filter(b => b.severity === 'Critical').length,
      high: this.bugs.filter(b => b.severity === 'High').length,
      medium: this.bugs.filter(b => b.severity === 'Medium').length,
    };

    return {
      passed: summary.critical === 0 && summary.high === 0,
      bugs: this.bugs,
      summary,
    };
  }

  private checkHorizontalScroll(element: HTMLElement) {
    // Check if element is wider than viewport
    if (element.scrollWidth > element.clientWidth) {
      this.bugs.push({
        severity: 'Critical',
        issue: 'Horizontal scrolling detected',
        location: element.tagName + (element.className ? `.${element.className.split(' ')[0]}` : ''),
        likelyCause: 'Element width exceeds viewport, missing overflow-x-hidden or max-width constraint',
        fix: 'Add `overflow-x-hidden` and `max-w-full` classes. Check for fixed widths in children.',
      });
    }

    // Check children recursively
    Array.from(element.children).forEach(child => {
      if (child instanceof HTMLElement) {
        const childWidth = child.getBoundingClientRect().width;
        const parentWidth = element.getBoundingClientRect().width;
        
        if (childWidth > parentWidth) {
          this.bugs.push({
            severity: 'High',
            issue: 'Child element exceeds parent width',
            location: child.tagName + (child.className ? `.${child.className.split(' ')[0]}` : ''),
            likelyCause: 'Fixed width, min-width, or whitespace-nowrap without proper container constraints',
            fix: 'Add `max-w-full` or `min-w-0` to parent flex/grid container. Use `truncate` or `break-words` for text.',
          });
        }
      }
    });
  }

  private checkTextOverflow(element: HTMLElement) {
    const textNodes = this.getTextElements(element);
    
    textNodes.forEach(node => {
      const computed = window.getComputedStyle(node);
      const overflowX = computed.overflowX;
      const whiteSpace = computed.whiteSpace;
      
      // Check if text can overflow without wrapping
      if (whiteSpace === 'nowrap' && overflowX === 'visible') {
        this.bugs.push({
          severity: 'High',
          issue: 'Text may overflow container',
          location: node.tagName + (node.className ? `.${node.className.split(' ')[0]}` : ''),
          likelyCause: 'white-space: nowrap without overflow handling',
          fix: 'Add `truncate` class (overflow-hidden + text-ellipsis) or use `break-words` for wrapping.',
        });
      }

      // Check for long words without break
      const text = node.textContent || '';
      const hasLongWord = text.split(/\s+/).some(word => word.length > 30);
      
      if (hasLongWord && computed.wordBreak === 'normal' && computed.overflowWrap === 'normal') {
        this.bugs.push({
          severity: 'Medium',
          issue: 'Long words may not wrap properly',
          location: node.tagName + (node.className ? `.${node.className.split(' ')[0]}` : ''),
          likelyCause: 'No word-break or overflow-wrap set for long words',
          fix: 'Add `break-words` or `hyphens-auto` class.',
        });
      }
    });
  }

  private checkClippedContent(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    
    // Check if content is clipped by parent
    if (element.scrollHeight > element.clientHeight && 
        window.getComputedStyle(element).overflow === 'hidden') {
      this.bugs.push({
        severity: 'High',
        issue: 'Content appears to be clipped',
        location: element.tagName + (element.className ? `.${element.className.split(' ')[0]}` : ''),
        likelyCause: 'overflow: hidden with content exceeding container height',
        fix: 'Use `overflow-y-auto` for scrollable content or increase container height. Check line-clamp usage.',
      });
    }

    // Check for elements positioned outside viewport
    if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
      this.bugs.push({
        severity: 'Medium',
        issue: 'Element extends beyond viewport',
        location: element.tagName + (element.className ? `.${element.className.split(' ')[0]}` : ''),
        likelyCause: 'Absolute/fixed positioning without proper constraints',
        fix: 'Add `inset-x-0` or `max-w-screen` constraints. Check z-index stacking.',
      });
    }
  }

  private checkSpacingIssues(element: HTMLElement) {
    const computed = window.getComputedStyle(element);
    
    // Check for negative margins that might cause overlap
    const marginLeft = parseInt(computed.marginLeft);
    const marginRight = parseInt(computed.marginRight);
    
    if (marginLeft < -16 || marginRight < -16) {
      this.bugs.push({
        severity: 'Medium',
        issue: 'Large negative margin detected',
        location: element.tagName + (element.className ? `.${element.className.split(' ')[0]}` : ''),
        likelyCause: 'Negative margin causing potential overlap or overflow',
        fix: 'Review negative margin usage. Use flexbox gap or padding instead.',
      });
    }

    // Check for inconsistent padding
    const children = Array.from(element.children) as HTMLElement[];
    if (children.length > 0) {
      const paddings = children.map(c => parseInt(window.getComputedStyle(c).padding));
      const hasInconsistentPadding = new Set(paddings).size > 3;
      
      if (hasInconsistentPadding) {
        this.bugs.push({
          severity: 'Medium',
          issue: 'Inconsistent spacing in children',
          location: element.tagName + (element.className ? `.${element.className.split(' ')[0]}` : ''),
          likelyCause: 'Mixed padding values across similar elements',
          fix: 'Standardize spacing using Tailwind spacing scale (p-4, p-6, etc.).',
        });
      }
    }
  }

  private checkViewportConstraints(element: HTMLElement, targetWidth: number) {
    const rect = element.getBoundingClientRect();
    
    // Check if element respects target mobile width
    if (rect.width > targetWidth) {
      const computed = window.getComputedStyle(element);
      const hasMaxWidth = computed.maxWidth !== 'none';
      
      if (!hasMaxWidth) {
        this.bugs.push({
          severity: 'Critical',
          issue: `Element exceeds target mobile width (${targetWidth}px)`,
          location: element.tagName + (element.className ? `.${element.className.split(' ')[0]}` : ''),
          likelyCause: 'No max-width constraint for mobile viewport',
          fix: 'Add `max-w-screen` or `w-full` class. Ensure parent has `overflow-x-hidden`.',
        });
      }
    }
  }

  private getTextElements(element: HTMLElement): HTMLElement[] {
    const textElements: HTMLElement[] = [];
    
    const walk = (node: HTMLElement) => {
      if (node.children.length === 0 && node.textContent?.trim()) {
        textElements.push(node);
      } else {
        Array.from(node.children).forEach(child => {
          if (child instanceof HTMLElement) {
            walk(child);
          }
        });
      }
    };
    
    walk(element);
    return textElements;
  }
}

/**
 * Automated QA runner for mobile validation
 */
export function runMobileQA(): MobileUIValidationResult {
  const validator = new MobileUIValidator();
  const mainContainer = document.querySelector('body') as HTMLElement;
  
  if (!mainContainer) {
    return {
      passed: false,
      bugs: [{
        severity: 'Critical',
        issue: 'Cannot find main container',
        location: 'document.body',
        likelyCause: 'DOM not ready or body element missing',
        fix: 'Ensure QA runs after DOM is loaded.',
      }],
      summary: { critical: 1, high: 0, medium: 0 },
    };
  }
  
  return validator.validate(mainContainer);
}
