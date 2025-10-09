import { useEffect, useRef, useState } from "react";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "@/styles/grapesjs-custom.css";
import gjsPresetWebpage from "grapesjs-preset-webpage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code, Eye, Sparkles, Send, Loader2, Save, FolderOpen, Download, Palette, LayoutGrid } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { toast } from "sonner";
import { WebComponentsPanel } from "./design-studio/WebComponentsPanel";
import { SaveTemplateDialog } from "./design-studio/SaveTemplateDialog";
import { TemplateGallery } from "./design-studio/TemplateGallery";
import { ExportDialog } from "./design-studio/ExportDialog";
import { DesignTokensPanel } from "./design-studio/DesignTokensPanel";
import { LayoutControlsPanel } from "./design-studio/LayoutControlsPanel";
import { HierarchicalBlockManager } from "./HierarchicalBlockManager";
import { supabase } from "@/integrations/supabase/client";

interface GrapeJSEditorProps {
  initialHtml?: string;
  initialCss?: string;
  onSave?: (html: string, css: string) => void;
}

export const GrapeJSEditor = ({ initialHtml, initialCss, onSave }: GrapeJSEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [htmlCode, setHtmlCode] = useState(initialHtml || "");
  const [cssCode, setCssCode] = useState(initialCss || "");
  const [activeTab, setActiveTab] = useState<"html" | "css">("html");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTokensPanel, setShowTokensPanel] = useState(false);
  const [showLayoutPanel, setShowLayoutPanel] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const grapesEditor = grapesjs.init({
      container: editorRef.current,
      height: "100%",
      width: "100%",
      plugins: [gjsPresetWebpage],
      pluginsOpts: {
        [gjsPresetWebpage as any]: {
          blocksBasicOpts: {
            blocks: ["column1", "column2", "column3", "text", "link", "image", "video"],
            flexGrid: true,
          },
          blocks: ["link-block", "quote", "text-basic"],
        },
      },
      storageManager: false,
      canvas: {
        styles: [],
        scripts: [],
      },
      // Clean panel configuration
      panels: {
        defaults: [
          {
            id: "layers",
            el: ".panel__right",
            resizable: {
              maxDim: 350,
              minDim: 200,
              tc: false,
              cl: true,
              cr: false,
              bc: false,
            },
          },
          {
            id: "panel-switcher",
            el: ".panel__switcher",
            buttons: [
              {
                id: "show-layers",
                active: true,
                label: "Layers",
                command: "show-layers",
                togglable: false,
              },
              {
                id: "show-style",
                active: true,
                label: "Styles",
                command: "show-styles",
                togglable: false,
              },
              {
                id: "show-traits",
                active: true,
                label: "Settings",
                command: "show-traits",
                togglable: false,
              },
            ],
          },
          {
            id: "panel-devices",
            el: ".panel__devices",
            buttons: [
              {
                id: "device-desktop",
                label: "Desktop",
                command: "set-device-desktop",
                active: true,
                togglable: false,
              },
              {
                id: "device-tablet",
                label: "Tablet",
                command: "set-device-tablet",
                togglable: false,
              },
              {
                id: "device-mobile",
                label: "Mobile",
                command: "set-device-mobile",
                togglable: false,
              },
            ],
          },
        ],
      },
      deviceManager: {
        devices: [
          {
            name: "Desktop",
            width: "",
          },
          {
            name: "Tablet",
            width: "768px",
            widthMedia: "992px",
          },
          {
            name: "Mobile",
            width: "320px",
            widthMedia: "480px",
          },
        ],
      },
      blockManager: {
        blocks: [
          // Hero Section
          {
            id: 'hero-section',
            label: 'Hero Section',
            category: 'Sections',
            content: `
              <section style="padding: 80px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div style="max-width: 1200px; margin: 0 auto;">
                  <h1 style="font-size: 48px; font-weight: bold; color: white; margin-bottom: 20px;">Welcome to Our Platform</h1>
                  <p style="font-size: 20px; color: rgba(255,255,255,0.9); margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto;">Build amazing experiences with our industry-leading tools and components</p>
                  <button style="background: white; color: #667eea; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; border: none; cursor: pointer;">Get Started</button>
                </div>
              </section>
            `,
          },
          // Feature Grid
          {
            id: 'feature-grid',
            label: 'Feature Grid',
            category: 'Sections',
            content: `
              <section style="padding: 60px 20px; background: #f9fafb;">
                <div style="max-width: 1200px; margin: 0 auto;">
                  <h2 style="font-size: 36px; font-weight: bold; text-align: center; margin-bottom: 50px;">Our Features</h2>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                    <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="width: 48px; height: 48px; background: #667eea; border-radius: 8px; margin-bottom: 20px;"></div>
                      <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">Fast Performance</h3>
                      <p style="color: #6b7280; line-height: 1.6;">Lightning-fast load times and optimal performance for the best user experience.</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="width: 48px; height: 48px; background: #764ba2; border-radius: 8px; margin-bottom: 20px;"></div>
                      <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">Easy to Use</h3>
                      <p style="color: #6b7280; line-height: 1.6;">Intuitive interface designed for both beginners and professionals.</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="width: 48px; height: 48px; background: #f093fb; border-radius: 8px; margin-bottom: 20px;"></div>
                      <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">Secure</h3>
                      <p style="color: #6b7280; line-height: 1.6;">Enterprise-grade security to keep your data safe and protected.</p>
                    </div>
                  </div>
                </div>
              </section>
            `,
          },
          // Testimonial Section
          {
            id: 'testimonial',
            label: 'Testimonials',
            category: 'Sections',
            content: `
              <section style="padding: 60px 20px; background: white;">
                <div style="max-width: 1200px; margin: 0 auto;">
                  <h2 style="font-size: 36px; font-weight: bold; text-align: center; margin-bottom: 50px;">What Our Customers Say</h2>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px;">
                    <div style="background: #f9fafb; padding: 30px; border-radius: 12px; border-left: 4px solid #667eea;">
                      <p style="font-size: 16px; line-height: 1.8; color: #374151; margin-bottom: 20px;">"This platform has transformed how we work. The tools are powerful yet easy to use."</p>
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 48px; height: 48px; background: #667eea; border-radius: 50%;"></div>
                        <div>
                          <div style="font-weight: 600; color: #111827;">Sarah Johnson</div>
                          <div style="font-size: 14px; color: #6b7280;">CEO, TechCorp</div>
                        </div>
                      </div>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 12px; border-left: 4px solid #764ba2;">
                      <p style="font-size: 16px; line-height: 1.8; color: #374151; margin-bottom: 20px;">"Outstanding experience! The best solution we've found for our needs."</p>
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 48px; height: 48px; background: #764ba2; border-radius: 50%;"></div>
                        <div>
                          <div style="font-weight: 600; color: #111827;">Michael Chen</div>
                          <div style="font-size: 14px; color: #6b7280;">Designer, CreativeStudio</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            `,
          },
          // CTA Section
          {
            id: 'cta-section',
            label: 'Call to Action',
            category: 'Sections',
            content: `
              <section style="padding: 80px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
                <div style="max-width: 800px; margin: 0 auto;">
                  <h2 style="font-size: 40px; font-weight: bold; color: white; margin-bottom: 20px;">Ready to Get Started?</h2>
                  <p style="font-size: 18px; color: rgba(255,255,255,0.9); margin-bottom: 30px;">Join thousands of users who are already using our platform</p>
                  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                    <button style="background: white; color: #667eea; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; border: none; cursor: pointer;">Start Free Trial</button>
                    <button style="background: transparent; color: white; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid white; cursor: pointer;">Learn More</button>
                  </div>
                </div>
              </section>
            `,
          },
          // Contact Form
          {
            id: 'contact-form',
            label: 'Contact Form',
            category: 'Forms',
            content: `
              <section style="padding: 60px 20px; background: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 15px rgba(0,0,0,0.1);">
                  <h2 style="font-size: 28px; font-weight: bold; margin-bottom: 24px; text-align: center;">Contact Us</h2>
                  <form>
                    <div style="margin-bottom: 20px;">
                      <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151;">Name</label>
                      <input type="text" placeholder="Your name" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px;">
                    </div>
                    <div style="margin-bottom: 20px;">
                      <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151;">Email</label>
                      <input type="email" placeholder="your@email.com" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px;">
                    </div>
                    <div style="margin-bottom: 20px;">
                      <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #374151;">Message</label>
                      <textarea placeholder="Your message" rows="4" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; resize: vertical;"></textarea>
                    </div>
                    <button type="submit" style="width: 100%; background: #667eea; color: white; padding: 14px; border-radius: 8px; font-weight: 600; font-size: 16px; border: none; cursor: pointer;">Send Message</button>
                  </form>
                </div>
              </section>
            `,
          },
          // Stats Section
          {
            id: 'stats-section',
            label: 'Stats Section',
            category: 'Sections',
            content: `
              <section style="padding: 60px 20px; background: white;">
                <div style="max-width: 1200px; margin: 0 auto;">
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; text-align: center;">
                    <div>
                      <div style="font-size: 48px; font-weight: bold; color: #667eea; margin-bottom: 8px;">10K+</div>
                      <div style="font-size: 18px; color: #6b7280;">Active Users</div>
                    </div>
                    <div>
                      <div style="font-size: 48px; font-weight: bold; color: #764ba2; margin-bottom: 8px;">50K+</div>
                      <div style="font-size: 18px; color: #6b7280;">Projects Created</div>
                    </div>
                    <div>
                      <div style="font-size: 48px; font-weight: bold; color: #f093fb; margin-bottom: 8px;">99.9%</div>
                      <div style="font-size: 18px; color: #6b7280;">Uptime</div>
                    </div>
                    <div>
                      <div style="font-size: 48px; font-weight: bold; color: #667eea; margin-bottom: 8px;">24/7</div>
                      <div style="font-size: 18px; color: #6b7280;">Support</div>
                    </div>
                  </div>
                </div>
              </section>
            `,
          },
          // Pricing Table
          {
            id: 'pricing-table',
            label: 'Pricing Table',
            category: 'Sections',
            content: `
              <section style="padding: 60px 20px; background: #f9fafb;">
                <div style="max-width: 1200px; margin: 0 auto;">
                  <h2 style="font-size: 36px; font-weight: bold; text-align: center; margin-bottom: 50px;">Choose Your Plan</h2>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="font-size: 14px; font-weight: 600; color: #667eea; margin-bottom: 8px;">STARTER</div>
                      <div style="font-size: 40px; font-weight: bold; margin-bottom: 20px;">$19<span style="font-size: 16px; color: #6b7280;">/mo</span></div>
                      <ul style="list-style: none; padding: 0; margin-bottom: 30px;">
                        <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">✓ 5 Projects</li>
                        <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">✓ Basic Support</li>
                        <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">✓ 10GB Storage</li>
                      </ul>
                      <button style="width: 100%; background: #667eea; color: white; padding: 14px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer;">Choose Plan</button>
                    </div>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px; box-shadow: 0 10px 20px rgba(102,126,234,0.3); transform: scale(1.05);">
                      <div style="font-size: 14px; font-weight: 600; color: white; margin-bottom: 8px;">PRO</div>
                      <div style="font-size: 40px; font-weight: bold; color: white; margin-bottom: 20px;">$49<span style="font-size: 16px; color: rgba(255,255,255,0.8);">/mo</span></div>
                      <ul style="list-style: none; padding: 0; margin-bottom: 30px; color: white;">
                        <li style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">✓ Unlimited Projects</li>
                        <li style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">✓ Priority Support</li>
                        <li style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">✓ 100GB Storage</li>
                      </ul>
                      <button style="width: 100%; background: white; color: #667eea; padding: 14px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer;">Choose Plan</button>
                    </div>
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <div style="font-size: 14px; font-weight: 600; color: #667eea; margin-bottom: 8px;">ENTERPRISE</div>
                      <div style="font-size: 40px; font-weight: bold; margin-bottom: 20px;">$99<span style="font-size: 16px; color: #6b7280;">/mo</span></div>
                      <ul style="list-style: none; padding: 0; margin-bottom: 30px;">
                        <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">✓ Unlimited Everything</li>
                        <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">✓ 24/7 Support</li>
                        <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">✓ Unlimited Storage</li>
                      </ul>
                      <button style="width: 100%; background: #667eea; color: white; padding: 14px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer;">Choose Plan</button>
                    </div>
                  </div>
                </div>
              </section>
            `,
          },
          // Footer
          {
            id: 'footer',
            label: 'Footer',
            category: 'Sections',
            content: `
              <footer style="background: #1f2937; color: white; padding: 60px 20px 30px;">
                <div style="max-width: 1200px; margin: 0 auto;">
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; margin-bottom: 40px;">
                    <div>
                      <div style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Company</div>
                      <p style="color: #9ca3af; line-height: 1.6;">Building the future of web design, one component at a time.</p>
                    </div>
                    <div>
                      <div style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Product</div>
                      <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="margin-bottom: 12px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Features</a></li>
                        <li style="margin-bottom: 12px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Pricing</a></li>
                        <li style="margin-bottom: 12px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Security</a></li>
                      </ul>
                    </div>
                    <div>
                      <div style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Company</div>
                      <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="margin-bottom: 12px;"><a href="#" style="color: #9ca3af; text-decoration: none;">About</a></li>
                        <li style="margin-bottom: 12px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Blog</a></li>
                        <li style="margin-bottom: 12px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Careers</a></li>
                      </ul>
                    </div>
                    <div>
                      <div style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Legal</div>
                      <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="margin-bottom: 12px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Privacy</a></li>
                        <li style="margin-bottom: 12px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Terms</a></li>
                        <li style="margin-bottom: 12px;"><a href="#" style="color: #9ca3af; text-decoration: none;">License</a></li>
                      </ul>
                    </div>
                  </div>
                  <div style="border-top: 1px solid #374151; padding-top: 30px; text-align: center; color: #9ca3af;">
                    © 2025 Your Company. All rights reserved.
                  </div>
                </div>
              </footer>
            `,
          },
          // Card Component
          {
            id: 'card',
            label: 'Card',
            category: 'Components',
            content: `
              <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 350px;">
                <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                <div style="padding: 24px;">
                  <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">Card Title</h3>
                  <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">This is a beautiful card component with an image and text content.</p>
                  <button style="background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; font-weight: 600; border: none; cursor: pointer;">Learn More</button>
                </div>
              </div>
            `,
          },
          // Navigation Bar
          {
            id: 'navbar',
            label: 'Navigation',
            category: 'Components',
            content: `
              <nav style="background: white; border-bottom: 1px solid #e5e7eb; padding: 16px 20px;">
                <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #667eea;">Logo</div>
                  <div style="display: flex; gap: 32px; align-items: center;">
                    <a href="#" style="color: #374151; text-decoration: none; font-weight: 500;">Home</a>
                    <a href="#" style="color: #374151; text-decoration: none; font-weight: 500;">Features</a>
                    <a href="#" style="color: #374151; text-decoration: none; font-weight: 500;">Pricing</a>
                    <a href="#" style="color: #374151; text-decoration: none; font-weight: 500;">About</a>
                    <button style="background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; font-weight: 600; border: none; cursor: pointer;">Sign In</button>
                  </div>
                </div>
              </nav>
            `,
          },
        ],
      },
    });

    // Load initial content
    if (initialHtml) {
      grapesEditor.setComponents(initialHtml);
    }
    if (initialCss) {
      grapesEditor.setStyle(initialCss);
    }

    // Update code states when editor changes
    grapesEditor.on("update", () => {
      setHtmlCode(grapesEditor.getHtml());
      setCssCode(grapesEditor.getCss());
    });

    // Enable snap-to-grid and alignment guides
    grapesEditor.on('component:drag:start', () => {
      const canvas = grapesEditor.Canvas.getElement();
      if (canvas) {
        canvas.style.backgroundImage = `
          repeating-linear-gradient(0deg, transparent, transparent 9px, rgba(0,0,0,0.05) 9px, rgba(0,0,0,0.05) 10px),
          repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(0,0,0,0.05) 9px, rgba(0,0,0,0.05) 10px)
        `;
        canvas.style.backgroundSize = '10px 10px';
      }
    });

    grapesEditor.on('component:drag:end', () => {
      const canvas = grapesEditor.Canvas.getElement();
      if (canvas) {
        canvas.style.backgroundImage = '';
      }
    });

    setEditor(grapesEditor);

    return () => {
      grapesEditor.destroy();
    };
  }, []);

  // Track GrapesJS fullscreen state to keep AI Assistant visible
  useEffect(() => {
    if (!editor) return;
    const onFs = () => setIsFullscreen(true);
    const offFs = () => setIsFullscreen(false);
    editor.on('run:fullscreen', onFs);
    editor.on('stop:fullscreen', offFs);
    return () => {
      editor.off('run:fullscreen', onFs);
      editor.off('stop:fullscreen', offFs);
    };
  }, [editor]);

  const handleCodeUpdate = () => {
    if (!editor) return;
    
    try {
      editor.setComponents(htmlCode);
      editor.setStyle(cssCode);
      setShowCode(false);
      toast("Code updated successfully");
    } catch (error) {
      console.error("Error updating code:", error);
      toast.error("Error updating code. Please check your HTML/CSS syntax");
    }
  };

  const handleQuickSave = () => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const css = editor.getCss();
    onSave?.(html, css);
    toast("Changes saved");
  };

  const handleSaveAsTemplate = async (data: {
    name: string;
    description: string;
    isPublic: boolean;
  }) => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to save templates");
        return;
      }

      const html = editor.getHtml();
      const css = editor.getCss();

      const { error } = await supabase
        .from('design_templates')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          is_public: data.isPublic,
          canvas_data: { html, css },
        });

      if (error) throw error;

      toast.success("Template saved successfully");
      setSaveDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadTemplate = (html: string, css: string) => {
    if (!editor) return;

    try {
      editor.setComponents(html);
      editor.setStyle(css);
      setHtmlCode(html);
      setCssCode(css);
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  };

  const handleExport = () => {
    if (!editor) return;
    setExportDialogOpen(true);
  };

  const handleComponentSelect = (component: any) => {
    if (!editor) return;

    const { config } = component;
    
    // Add component to the canvas
    editor.addComponents(config.html || '');
    
    // Add CSS if provided
    if (config.css) {
      const currentCss = editor.getCss();
      editor.setStyle(currentCss + '\n' + config.css);
    }
    
    toast(`${component.name} added to canvas`);
  };

  const handleAiAssist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editor || !aiPrompt.trim()) {
      toast.error("Please enter a design instruction");
      return;
    }

    setIsAiProcessing(true);
    console.log("Processing AI design request:", aiPrompt);

    try {
      const currentHtml = editor.getHtml();
      const currentCss = editor.getCss();

      const { data, error } = await supabase.functions.invoke('ai-design-assistant', {
        body: {
          prompt: aiPrompt,
          currentHtml,
          currentCss
        }
      });

      if (error) {
        console.error("AI assistant error:", error);
        throw error;
      }

      if (data?.html !== undefined && data?.css !== undefined) {
        // Extract body content from full HTML if needed
        let htmlContent = data.html;
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          htmlContent = bodyMatch[1];
        }
        
        // Apply the AI-generated changes
        editor.setComponents(htmlContent);
        editor.setStyle(data.css);
        
        toast.success("Design updated by AI");
        setAiPrompt("");
      } else {
        throw new Error("Invalid response from AI assistant");
      }
    } catch (error: any) {
      console.error("Error in AI assistant:", error);
      
      if (error.message?.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes("Payment required")) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Failed to process AI request. Please try again.");
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      <div className="h-9 sm:h-10 border-b bg-card flex items-center justify-between px-2 sm:px-4 flex-shrink-0 min-w-0">
        <div className="panel__devices flex gap-1 min-w-0"></div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTokensPanel(!showTokensPanel)}
              className="h-7 sm:h-8 px-2"
            >
              <Palette className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tokens</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLayoutPanel(!showLayoutPanel)}
              className="h-7 sm:h-8 px-2"
            >
              <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Layout</span>
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => setGalleryOpen(true)}
            className="h-7 sm:h-8 px-2"
          >
            <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Templates</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-7 sm:h-8 px-2"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="h-7 sm:h-8 px-2"
          >
            {showCode ? <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> : <Code className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />}
            <span className="hidden sm:inline">{showCode ? "Visual" : "Code"}</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => setSaveDialogOpen(true)} 
            className="h-7 sm:h-8 px-2 text-xs sm:text-sm"
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {showCode ? (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="border-b bg-card">
            <div className="flex gap-2 p-2">
              <Button
                variant={activeTab === "html" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("html")}
              >
                HTML
              </Button>
              <Button
                variant={activeTab === "css" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("css")}
              >
                CSS
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCodeUpdate}
                className="ml-auto"
              >
                Apply Changes
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            {activeTab === "html" ? (
              <MonacoEditor
                height="100%"
                defaultLanguage="html"
                value={htmlCode}
                onChange={(value) => setHtmlCode(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            ) : (
              <MonacoEditor
                height="100%"
                defaultLanguage="css"
                value={cssCode}
                onChange={(value) => setCssCode(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
            {/* Left Sidebar - Hierarchical Block Manager */}
            <div className="w-full sm:w-64 border-b sm:border-r sm:border-b-0 bg-card max-h-[40vh] sm:max-h-none flex-shrink-0 overflow-hidden">
              <HierarchicalBlockManager editor={editor} />
            </div>

            {/* Center - Canvas */}
            <div className={`flex-1 relative min-h-[300px] overflow-hidden ${isFullscreen ? 'pb-24' : ''}`}>
              <div ref={editorRef} className="h-full w-full" />
            </div>

            {/* Right Sidebar - Design Tokens */}
            {showTokensPanel && (
              <div className="w-full sm:w-72 border-t sm:border-l sm:border-t-0 max-h-[40vh] sm:max-h-none flex-shrink-0 overflow-hidden">
                <DesignTokensPanel
                  onTokensUpdate={(tokens) => {
                    if (!editor) return;
                    const css = `
:root {
  --color-primary: ${tokens.colors.primary};
  --color-secondary: ${tokens.colors.secondary};
  --color-accent: ${tokens.colors.accent};
  --color-background: ${tokens.colors.background};
  --color-text: ${tokens.colors.text};
  --color-border: ${tokens.colors.border};
  --font-heading: ${tokens.fonts.heading};
  --font-body: ${tokens.fonts.body};
  --spacing-md: ${tokens.spacing.md};
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-body);
}`;
                    const currentCss = editor.getCss();
                    editor.setStyle(css + '\n' + currentCss);
                  }}
                />
              </div>
            )}

            {/* Right Sidebar - Layout Controls */}
            {showLayoutPanel && !showTokensPanel && (
              <div className="w-full sm:w-72 border-t sm:border-l sm:border-t-0 max-h-[40vh] sm:max-h-none flex-shrink-0 overflow-hidden">
                <LayoutControlsPanel
                  onLayoutUpdate={(layout) => {
                    if (!editor) return;
                    const selected = editor.getSelected();
                    if (!selected) {
                      toast.info("Select an element to apply layout");
                      return;
                    }
                    
                    const styles: Record<string, string> = {
                      display: layout.display,
                    };

                    if (layout.display === 'flex') {
                      if (layout.flexDirection) styles['flex-direction'] = layout.flexDirection;
                      if (layout.justifyContent) styles['justify-content'] = layout.justifyContent;
                      if (layout.alignItems) styles['align-items'] = layout.alignItems;
                    }

                    if (layout.display === 'grid') {
                      if (layout.gridCols) styles['grid-template-columns'] = `repeat(${layout.gridCols}, 1fr)`;
                      if (layout.gridRows) styles['grid-template-rows'] = `repeat(${layout.gridRows}, 1fr)`;
                    }

                    if (layout.gap) styles.gap = layout.gap;
                    if (layout.padding) styles.padding = layout.padding;
                    if (layout.position) styles.position = layout.position;
                    if (layout.zIndex !== undefined) styles['z-index'] = String(layout.zIndex);

                    selected.setStyle(styles);
                    toast.success("Layout applied to selected element");
                  }}
                />
              </div>
            )}
          </div>

          {/* AI Assistant - Always Visible at Bottom */}
          <div className={`border-t bg-card p-3 flex-shrink-0 ${isFullscreen ? 'fixed bottom-0 left-0 right-0 z-[99999] shadow-lg' : ''}`}>
            <form onSubmit={handleAiAssist} className="flex gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Ask AI to create or modify your design (e.g., 'Create a modern landing page for a SaaS product')"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isAiProcessing}
                  className="flex-1"
                />
              </div>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isAiProcessing || !aiPrompt.trim()}
                className="flex gap-2"
              >
                {isAiProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Generate</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      <SaveTemplateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveAsTemplate}
        isLoading={isSaving}
      />

      <TemplateGallery
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onLoadTemplate={handleLoadTemplate}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        html={htmlCode}
        css={cssCode}
      />
    </div>
  );
};
