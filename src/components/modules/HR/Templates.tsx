import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Phone, Mail, User, Briefcase, GraduationCap, Award, FileText, Building2, Download,  ChevronDown } from 'lucide-react';

/*
OLF Offer Letter Generator with Advanced Download Features

🎯 DOWNLOAD FUNCTIONALITY:
✅ PDF Generation - High-quality PDF with proper pagination using jsPDF + html2canvas
✅ Image Export - High-resolution PNG download (3x scale for crisp quality)
✅ Print Support - Browser-optimized print styles for direct printing
✅ Smart File Naming - Auto-generated names with candidate name and date
✅ Color Compatibility - Converts oklch/modern CSS colors to html2canvas-compatible formats

📚 LIBRARIES USED:
- html2canvas (1.4.1) - Converts HTML/CSS to canvas for image generation
- jsPDF (2.5.1) - Creates PDF documents from images with multi-page support

🔧 FEATURES:
- Dynamic library loading from CDN
- Real-time download progress messages
- Error handling with user-friendly feedback
- Responsive UI with dropdown options
- Print-optimized CSS styling
- File naming with timestamps
- Automatic color format conversion for compatibility

🎨 COLOR COMPATIBILITY FIX:
- Detects and converts oklch() color functions to standard RGB/hex
- Temporarily applies compatible colors during html2canvas rendering
- Restores original colors after generation
- Includes fallback color mappings for common Tailwind colors
- Uses inline styles to override potential Tailwind oklch conflicts

💡 HOW IT WORKS:
1. Libraries load asynchronously from cdnjs.cloudflare.com
2. Color compatibility layer converts oklch colors to standard formats
3. html2canvas captures the letter content as high-resolution image
4. For PDF: jsPDF converts image to multi-page PDF with proper A4 sizing
5. For Image: Canvas.toBlob creates downloadable PNG file
6. Files download with descriptive names including candidate and date
7. Original colors are restored after generation
*/

// Load external libraries
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Print styles
const printStyles = `
  @media print {
    .no-print { display: none !important; }
    body { font-size: 12pt; line-height: 1.4; }
    .print\\:shadow-none { box-shadow: none !important; }
    .print\\:border-none { border: none !important; }
    @page { margin: 1in; }
  }
`;

// Types
interface CandidateInfo {
  personalDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    profileImage: string;
  };
  experience: {
    position: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    grade: string;
  }[];
  skills: string[];
  about: string;
  expectedSalary: string;
  availableFrom: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  previewContent: string;
}

// Template Selection Component
const TemplateSelector: React.FC<{
  templates: Template[];
  selectedTemplate: string | null;
  onTemplateSelect: (templateId: string) => void;
}> = ({ templates, selectedTemplate, onTemplateSelect }) => {
  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building2 className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">OLF Offer Letter Templates</h2>
        <p className="text-gray-600 mt-2">Choose a template to create your offer letter</p>
      </div>
      
      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 capitalize">{category} Positions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.filter(t => t.category === category).map(template => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => onTemplateSelect(template.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {template.previewContent}
                  </div>
                  {selectedTemplate === template.id && (
                    <Badge className="mt-2" variant="default">Selected</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Personal Details Form Component
const PersonalDetailsForm: React.FC<{
  data: CandidateInfo['personalDetails'];
  onChange: (data: CandidateInfo['personalDetails']) => void;
}> = ({ data, onChange }) => {
  const handleChange = (field: keyof CandidateInfo['personalDetails'], value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        handleChange('profileImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={data.profileImage} />
          <AvatarFallback className="text-xl">
            {data.firstName?.[0]}{data.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="profile-image" className="cursor-pointer">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
              Upload Photo
            </div>
            <Input
              id="profile-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Enter first name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john@example.com"
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Textarea
            id="address"
            value={data.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter full address"
            className="pl-10"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

// Experience Form Component
const ExperienceForm: React.FC<{
  data: CandidateInfo['experience'];
  onChange: (data: CandidateInfo['experience']) => void;
}> = ({ data, onChange }) => {
  const addExperience = () => {
    onChange([...data, { position: '', company: '', duration: '', description: '' }]);
  };

  const updateExperience = (index: number, field: keyof CandidateInfo['experience'][0], value: string) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeExperience = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Briefcase className="mr-2 h-5 w-5" />
          Work Experience
        </h3>
        <Button onClick={addExperience} variant="outline" size="sm">
          Add Experience
        </Button>
      </div>

      {data.map((exp, index) => (
        <Card key={index}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">Experience #{index + 1}</h4>
              <Button 
                onClick={() => removeExperience(index)} 
                variant="destructive" 
                size="sm"
              >
                Remove
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Position Title</Label>
                <Input
                  value={exp.position}
                  onChange={(e) => updateExperience(index, 'position', e.target.value)}
                  placeholder="e.g., Senior Developer"
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  placeholder="e.g., Tech Corp"
                />
              </div>
            </div>
            
            <div>
              <Label>Duration</Label>
              <Input
                value={exp.duration}
                onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                placeholder="e.g., Jan 2020 - Dec 2023"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={exp.description}
                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                placeholder="Describe key responsibilities and achievements..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Briefcase className="mx-auto h-12 w-12 mb-4 text-gray-300" />
          <p>No work experience added yet</p>
          <Button onClick={addExperience} variant="outline" className="mt-2">
            Add First Experience
          </Button>
        </div>
      )}
    </div>
  );
};

// Education Form Component
const EducationForm: React.FC<{
  data: CandidateInfo['education'];
  onChange: (data: CandidateInfo['education']) => void;
}> = ({ data, onChange }) => {
  const addEducation = () => {
    onChange([...data, { degree: '', institution: '', year: '', grade: '' }]);
  };

  const updateEducation = (index: number, field: keyof CandidateInfo['education'][0], value: string) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeEducation = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <GraduationCap className="mr-2 h-5 w-5" />
          Education
        </h3>
        <Button onClick={addEducation} variant="outline" size="sm">
          Add Education
        </Button>
      </div>

      {data.map((edu, index) => (
        <Card key={index}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">Education #{index + 1}</h4>
              <Button 
                onClick={() => removeEducation(index)} 
                variant="destructive" 
                size="sm"
              >
                Remove
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Degree</Label>
                <Input
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  placeholder="e.g., Bachelor of Computer Science"
                />
              </div>
              <div>
                <Label>Institution</Label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  placeholder="e.g., MIT"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Graduation Year</Label>
                <Input
                  value={edu.year}
                  onChange={(e) => updateEducation(index, 'year', e.target.value)}
                  placeholder="e.g., 2023"
                />
              </div>
              <div>
                <Label>Grade/GPA</Label>
                <Input
                  value={edu.grade}
                  onChange={(e) => updateEducation(index, 'grade', e.target.value)}
                  placeholder="e.g., 3.8/4.0"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <GraduationCap className="mx-auto h-12 w-12 mb-4 text-gray-300" />
          <p>No education details added yet</p>
          <Button onClick={addEducation} variant="outline" className="mt-2">
            Add First Education
          </Button>
        </div>
      )}
    </div>
  );
};

// Skills Form Component
const SkillsForm: React.FC<{
  data: string[];
  onChange: (data: string[]) => void;
}> = ({ data, onChange }) => {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !data.includes(newSkill.trim())) {
      onChange([...data, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(data.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center">
        <Award className="mr-2 h-5 w-5" />
        Skills & Competencies
      </h3>
      
      <div className="flex space-x-2">
        <Input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a skill (e.g., React, Python, Leadership)"
          className="flex-1"
        />
        <Button onClick={addSkill} disabled={!newSkill.trim()}>
          Add Skill
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {data.map((skill, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="px-3 py-1 cursor-pointer hover:bg-red-100"
              onClick={() => removeSkill(skill)}
            >
              {skill} ×
            </Badge>
          ))}
        </div>
        
        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Award className="mx-auto h-12 w-12 mb-4 text-gray-300" />
            <p>No skills added yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Additional Details Form Component
const AdditionalDetailsForm: React.FC<{
  about: string;
  expectedSalary: string;
  availableFrom: string;
  onAboutChange: (value: string) => void;
  onSalaryChange: (value: string) => void;
  onAvailabilityChange: (value: string) => void;
}> = ({ about, expectedSalary, availableFrom, onAboutChange, onSalaryChange, onAvailabilityChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center">
        <User className="mr-2 h-5 w-5" />
        Additional Details
      </h3>
      
      <div>
        <Label htmlFor="about">About / Professional Summary</Label>
        <Textarea
          id="about"
          value={about}
          onChange={(e) => onAboutChange(e.target.value)}
          placeholder="Brief professional summary, career objectives, and key achievements..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salary">Expected Salary</Label>
          <Input
            id="salary"
            value={expectedSalary}
            onChange={(e) => onSalaryChange(e.target.value)}
            placeholder="e.g., $75,000 - $85,000"
          />
        </div>
        <div>
          <Label htmlFor="availability">Available From</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="availability"
              value={availableFrom}
              onChange={(e) => onAvailabilityChange(e.target.value)}
              placeholder="e.g., Immediately / 2 weeks notice"
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Offer Letter Template Component
const OfferLetterTemplate: React.FC<{
  candidateInfo: CandidateInfo;
  template: Template;
  onBack: () => void;
  onEdit: () => void;
}> = ({ candidateInfo, template, onBack, onEdit }) => {
  const letterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string>('');

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Load required libraries
  React.useEffect(() => {
    const loadLibraries = async () => {
      try {
        await Promise.all([
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
        ]);
        setLibrariesLoaded(true);
      } catch (error) {
        console.error('Failed to load libraries:', error);
      }
    };
    loadLibraries();
  }, []);

  const getTemplateContent = () => {
    const {  expectedSalary } = candidateInfo;
    
    switch (template.id) {
      case 'senior-dev':
        return {
          position: 'Senior Software Developer',
          department: 'Engineering',
          salary: expectedSalary || '$90,000 - $110,000',
          startDate: 'To be mutually agreed upon',
          responsibilities: [
            'Lead development of complex software applications',
            'Mentor junior developers and conduct code reviews',
            'Architect scalable and maintainable software solutions',
            'Collaborate with product managers and designers',
            'Drive technical decision-making and best practices'
          ]
        };
      case 'product-manager':
        return {
          position: 'Product Manager',
          department: 'Product',
          salary: expectedSalary || '$95,000 - $115,000',
          startDate: 'To be mutually agreed upon',
          responsibilities: [
            'Define and execute product strategy and roadmap',
            'Collaborate with engineering, design, and marketing teams',
            'Conduct market research and competitive analysis',
            'Manage product lifecycle from conception to launch',
            'Analyze product metrics and user feedback'
          ]
        };
      case 'ui-designer':
        return {
          position: 'UI/UX Designer',
          department: 'Design',
          salary: expectedSalary || '$70,000 - $90,000',
          startDate: 'To be mutually agreed upon',
          responsibilities: [
            'Design intuitive and engaging user interfaces',
            'Create wireframes, prototypes, and design systems',
            'Conduct user research and usability testing',
            'Collaborate with product and engineering teams',
            'Maintain brand consistency across all products'
          ]
        };
      default:
        return {
          position: template.name,
          department: 'Technology',
          salary: expectedSalary || 'Competitive salary package',
          startDate: 'To be mutually agreed upon',
          responsibilities: [
            'Execute assigned tasks and projects efficiently',
            'Collaborate with team members and stakeholders',
            'Contribute to team goals and company objectives',
            'Participate in professional development activities',
            'Maintain high standards of work quality'
          ]
        };
    }
  };

  const templateContent = getTemplateContent();

  const downloadAsPDF = async () => {
    if (!librariesLoaded || !letterRef.current) return;
    
    setIsDownloading(true);
    setDownloadMessage('Generating PDF...');
    
    try {
      const element = letterRef.current;
      
      // Fix oklch color issues by temporarily applying standard colors
      const originalElements = fixColorCompatibility(element);
      
      // Create canvas from HTML
      setDownloadMessage('Converting to image...');
      const canvas = await (window as any).html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        foreignObjectRendering: true,
        ignoreElements: (element: HTMLElement) => {
          return element.classList.contains('no-print');
        }
      });

      // Restore original colors
      restoreOriginalColors(originalElements);

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      setDownloadMessage('Creating PDF document...');
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const candidateName = `${candidateInfo.personalDetails.firstName}_${candidateInfo.personalDetails.lastName}`;
      const fileName = `OLF_Offer_Letter_${candidateName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      setDownloadMessage('Downloading PDF...');
      pdf.save(fileName);
      setDownloadMessage('✅ PDF downloaded successfully!');
      
      setTimeout(() => setDownloadMessage(''), 3000);
    } catch (error) {
      console.error('PDF generation failed:', error);
      setDownloadMessage('❌ Failed to generate PDF. Please try again.');
      setTimeout(() => setDownloadMessage(''), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsImage = async () => {
    if (!librariesLoaded || !letterRef.current) return;
    
    setIsDownloading(true);
    setDownloadMessage('Generating high-quality image...');
    
    try {
      const element = letterRef.current;
      
      // Fix oklch color issues
      const originalElements = fixColorCompatibility(element);
      
      const canvas = await (window as any).html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: false,
        foreignObjectRendering: true,
        ignoreElements: (element: HTMLElement) => {
          return element.classList.contains('no-print');
        }
      });

      // Restore original colors
      restoreOriginalColors(originalElements);

      // Convert to blob and download
      setDownloadMessage('Preparing download...');
      canvas.toBlob((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const candidateName = `${candidateInfo.personalDetails.firstName}_${candidateInfo.personalDetails.lastName}`;
        const fileName = `OLF_Offer_Letter_${candidateName}_${new Date().toISOString().slice(0, 10)}.png`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setDownloadMessage('✅ Image downloaded successfully!');
        setTimeout(() => setDownloadMessage(''), 3000);
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Image generation failed:', error);
      setDownloadMessage('❌ Failed to generate image. Please try again.');
      setTimeout(() => setDownloadMessage(''), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  // Fix color compatibility for html2canvas
  const fixColorCompatibility = (element: HTMLElement) => {
    const elementsToFix: Array<{element: HTMLElement, property: string, original: string}> = [];
    
    // Find all elements and their computed styles
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null
    );
    
    const nodes = [element];
    let node;
    while (node = walker.nextNode()) {
      nodes.push(node as HTMLElement);
    }
    
    nodes.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      
      // Common properties that might use oklch
      const propertiesToCheck = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'];
      
      propertiesToCheck.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && (value.includes('oklch') || value.includes('color('))) {
          const convertedColor = convertToStandardColor(value);
          if (convertedColor !== value) {
            elementsToFix.push({
              element: el,
              property: prop,
              original: el.style.getPropertyValue(prop) || ''
            });
            el.style.setProperty(prop, convertedColor, 'important');
          }
        }
      });
    });
    
    return elementsToFix;
  };

  // Restore original colors
  const restoreOriginalColors = (originalElements: Array<{element: HTMLElement, property: string, original: string}>) => {
    originalElements.forEach(({element, property, original}) => {
      if (original) {
        element.style.setProperty(property, original);
      } else {
        element.style.removeProperty(property);
      }
    });
  };

  // Convert oklch and other modern colors to standard formats
  const convertToStandardColor = (colorValue: string): string => {
    // Create a temporary element to get computed color
    const tempDiv = document.createElement('div');
    tempDiv.style.color = colorValue;
    document.body.appendChild(tempDiv);
    
    const computedColor = window.getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    
    // If we get a valid rgb/rgba value, use it
    if (computedColor && computedColor !== colorValue && !computedColor.includes('oklch')) {
      return computedColor;
    }
    
    // Fallback color mappings for common Tailwind colors
    const colorMap: {[key: string]: string} = {
      'oklch(0.2 0 0)': '#000000',
      'oklch(1 0 0)': '#ffffff',
      'oklch(0.478 0.166 258.4)': '#3b82f6', // blue-500
      'oklch(0.428 0.169 258.2)': '#2563eb', // blue-600
      'oklch(0.383 0.171 257.8)': '#1d4ed8', // blue-700
      'oklch(0.569 0.175 160.1)': '#10b981', // green-500
      'oklch(0.521 0.177 159.7)': '#059669', // green-600
      'oklch(0.621 0.183 27.3)': '#f59e0b',  // amber-500
      'oklch(0.681 0.026 83.7)': '#6b7280',  // gray-500
      'oklch(0.748 0.021 83.9)': '#9ca3af',  // gray-400
      'oklch(0.921 0.011 83.4)': '#f3f4f6',  // gray-100
      'oklch(0.967 0.006 83.1)': '#f9fafb'   // gray-50
    };
    
    return colorMap[colorValue] || '#000000'; // Default to black
  };

  const printLetter = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6 no-print">
        <h1 className="text-2xl font-bold">Generated Offer Letter</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onEdit} variant="outline" size="sm">
            Edit Details
          </Button>
          <Button onClick={onBack} variant="outline" size="sm">
            Back to Templates
          </Button>
          
          {/* Download Options Dropdown */}
          <div className="relative inline-block">
            <select 
              className="appearance-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 pr-8 rounded-md border-0 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'pdf') downloadAsPDF();
                else if (value === 'image') downloadAsImage();
                else if (value === 'print') printLetter();
                e.target.value = ''; // Reset selection
              }}
              disabled={!librariesLoaded || isDownloading}
            >
              <option value="">
                {isDownloading ? 'Generating...' : librariesLoaded ? 'Download Options' : 'Loading...'}
              </option>
              <option value="pdf">📄 Download as PDF</option>
              <option value="image">🖼️ Download as Image</option>
              <option value="print">🖨️ Print Letter</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
          </div>

          {/* Quick PDF Download Button */}
          <Button 
            onClick={downloadAsPDF} 
            className="bg-green-600 hover:bg-green-700" 
            size="sm"
            disabled={!librariesLoaded || isDownloading}
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Quick PDF'}
          </Button>
        </div>
      </div>

      {!librariesLoaded && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 no-print">
          <p className="text-yellow-800 text-sm">
            ⏳ Loading download libraries... PDF and image downloads will be available shortly.
          </p>
        </div>
      )}

      {downloadMessage && (
        <div className={`border rounded-lg p-4 no-print ${
          downloadMessage.includes('✅') ? 'bg-green-50 border-green-200' :
          downloadMessage.includes('❌') ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-sm ${
            downloadMessage.includes('✅') ? 'text-green-800' :
            downloadMessage.includes('❌') ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {downloadMessage}
          </p>
        </div>
      )}

      {/* Offer Letter Content */}
      <div 
        ref={letterRef}
        className="bg-white border rounded-lg p-8 shadow-sm print:shadow-none print:border-none"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 text-2xl font-bold text-blue-600 mb-4">
            <Building2 className="h-8 w-8" />
            <span>OLF</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OFFER OF EMPLOYMENT</h1>
          <p className="text-gray-600">Confidential</p>
        </div>

        {/* Date and Recipient */}
        <div className="mb-8">
          <p className="text-right text-gray-600 mb-6">{currentDate}</p>
          
          <div className="mb-6">
            <p className="font-semibold">{candidateInfo.personalDetails.firstName} {candidateInfo.personalDetails.lastName}</p>
            {candidateInfo.personalDetails.address && (
              <p className="text-gray-600 whitespace-pre-line">{candidateInfo.personalDetails.address}</p>
            )}
            <p className="text-gray-600">{candidateInfo.personalDetails.email}</p>
            <p className="text-gray-600">{candidateInfo.personalDetails.phone}</p>
          </div>
        </div>

        {/* Letter Content */}
        <div className="space-y-6 text-gray-800 leading-relaxed">
          <p className="text-lg">
            <strong>Dear {candidateInfo.personalDetails.firstName},</strong>
          </p>

          <p>
            On behalf of OLF, I am pleased to offer you the position of <strong>{templateContent.position}</strong> 
            in our <strong>{templateContent.department}</strong> department. We were impressed by your qualifications, 
            experience, and the enthusiasm you demonstrated during the interview process.
          </p>

          {/* Candidate Highlights */}
          {(candidateInfo.experience.length > 0 || candidateInfo.skills.length > 0) && (
            <div>
              <p>We are particularly excited about your background, including:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {candidateInfo.experience.slice(0, 2).map((exp, index) => (
                  <li key={index}>Your experience as {exp.position} at {exp.company}</li>
                ))}
                {candidateInfo.skills.slice(0, 3).map((skill, index) => (
                  <li key={index}>Your expertise in {skill}</li>
                ))}
                {candidateInfo.education.length > 0 && (
                  <li>Your {candidateInfo.education[0].degree} from {candidateInfo.education[0].institution}</li>
                )}
              </ul>
            </div>
          )}

          {/* Position Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Position Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Position:</strong> {templateContent.position}</p>
                <p><strong>Department:</strong> {templateContent.department}</p>
                <p><strong>Start Date:</strong> {candidateInfo.availableFrom || templateContent.startDate}</p>
              </div>
              <div>
                <p><strong>Salary:</strong> {templateContent.salary}</p>
                <p><strong>Employment Type:</strong> Full-time</p>
                <p><strong>Reports To:</strong> Department Manager</p>
              </div>
            </div>
          </div>

          {/* Key Responsibilities */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Key Responsibilities</h3>
            <p className="mb-3">In this role, you will be responsible for:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              {templateContent.responsibilities.map((responsibility, index) => (
                <li key={index}>{responsibility}</li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Benefits Package</h3>
            <p className="mb-3">As an OLF employee, you will be eligible for our comprehensive benefits package, including:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Health, dental, and vision insurance</li>
              <li>401(k) retirement plan with company matching</li>
              <li>Flexible PTO and holiday schedule</li>
              <li>Professional development opportunities</li>
              <li>Remote work flexibility</li>
              <li>Performance-based bonuses</li>
            </ul>
          </div>

          {/* Closing */}
          <div className="space-y-4">
            <p>
              To accept this offer, please sign and return this letter by [DATE - typically 1 week from offer date]. 
              Your employment with OLF will be contingent upon successful completion of background checks and 
              any other pre-employment requirements.
            </p>

            <p>
              We are excited about the possibility of you joining our team and contributing to OLF's continued success. 
              If you have any questions about this offer, please don't hesitate to contact me.
            </p>

            <p className="pt-4">
              Sincerely,<br/>
              <strong>Sarah Johnson</strong><br/>
              <em>HR Director, OLF</em><br/>
              <em>sarah.johnson@olf.com</em><br/>
              <em>(555) 123-4567</em>
            </p>
          </div>

          {/* Signature Section */}
          <div className="border-t pt-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="mb-4"><strong>Candidate Acceptance:</strong></p>
                <p className="mb-2">I accept the terms and conditions of this offer:</p>
                <div className="border-b border-gray-300 mb-2 pb-1">
                  <p className="text-sm text-gray-500">Signature</p>
                </div>
                <div className="border-b border-gray-300 mb-4 pb-1">
                  <p className="text-sm text-gray-500">Date</p>
                </div>
              </div>
              <div>
                <p className="mb-4"><strong>Company Representative:</strong></p>
                <div className="border-b border-gray-300 mb-2 pb-1">
                  <p className="text-sm">Sarah Johnson</p>
                  <p className="text-xs text-gray-500">HR Director</p>
                </div>
                <div className="border-b border-gray-300 mb-4 pb-1">
                  <p className="text-sm text-gray-500">Date: {currentDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const OfferLetterGenerator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'template' | 'form' | 'generated'>('template');
  
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    personalDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      profileImage: '',
    },
    experience: [],
    education: [],
    skills: [],
    about: '',
    expectedSalary: '',
    availableFrom: '',
  });

  const templates: Template[] = [
    {
      id: 'senior-dev',
      name: 'Senior Developer',
      description: 'For senior software development positions',
      category: 'technical',
      previewContent: 'We are pleased to offer you the position of Senior Developer at OLF. This role involves leading development projects, mentoring junior developers, and architecting scalable solutions...',
    },
    {
      id: 'product-manager',
      name: 'Product Manager',
      description: 'For product management roles',
      category: 'management',
      previewContent: 'We are excited to offer you the position of Product Manager at OLF. You will be responsible for defining product strategy, working with cross-functional teams, and driving product success...',
    },
    {
      id: 'ui-designer',
      name: 'UI/UX Designer',
      description: 'For design positions',
      category: 'design',
      previewContent: 'We are delighted to offer you the position of UI/UX Designer at OLF. Your role will involve creating intuitive user experiences, designing beautiful interfaces, and collaborating with development teams...',
    },
    {
      id: 'data-scientist',
      name: 'Data Scientist',
      description: 'For data science and analytics roles',
      category: 'technical',
      previewContent: 'We are pleased to offer you the position of Data Scientist at OLF. You will analyze complex datasets, build predictive models, and provide data-driven insights to drive business decisions...',
    },
    {
      id: 'marketing-manager',
      name: 'Marketing Manager',
      description: 'For marketing and growth positions',
      category: 'management',
      previewContent: 'We are excited to offer you the position of Marketing Manager at OLF. You will develop marketing strategies, manage campaigns, and drive brand growth across multiple channels...',
    },
    {
      id: 'junior-dev',
      name: 'Junior Developer',
      description: 'For entry-level development positions',
      category: 'technical',
      previewContent: 'We are pleased to offer you the position of Junior Developer at OLF. This is an excellent opportunity to grow your technical skills, work on exciting projects, and learn from experienced developers...',
    },
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setCurrentStep('form');
  };

  const handleBackToTemplates = () => {
    setCurrentStep('template');
    setSelectedTemplate(null);
  };

  const handleGenerateOffer = () => {
    // Basic validation
    const { personalDetails } = candidateInfo;
    if (!personalDetails.firstName || !personalDetails.lastName || !personalDetails.email) {
      alert('Please fill in at least the candidate\'s name and email address before generating the offer letter.');
      return;
    }
    setCurrentStep('generated');
  };

  const handleEditDetails = () => {
    setCurrentStep('form');
  };

  const updatePersonalDetails = (data: CandidateInfo['personalDetails']) => {
    setCandidateInfo(prev => ({ ...prev, personalDetails: data }));
  };

  const updateExperience = (data: CandidateInfo['experience']) => {
    setCandidateInfo(prev => ({ ...prev, experience: data }));
  };

  const updateEducation = (data: CandidateInfo['education']) => {
    setCandidateInfo(prev => ({ ...prev, education: data }));
  };

  const updateSkills = (data: string[]) => {
    setCandidateInfo(prev => ({ ...prev, skills: data }));
  };

  if (currentStep === 'template') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <TemplateSelector
          templates={templates}
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
        />
      </div>
    );
  }

  if (currentStep === 'generated') {
    const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
    return (
      <OfferLetterTemplate
        candidateInfo={candidateInfo}
        template={selectedTemplateData!}
        onBack={handleBackToTemplates}
        onEdit={handleEditDetails}
      />
    );
  }

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Offer Letter</h1>
            <p className="text-gray-600 mt-1">
              Template: <span className="font-medium">{selectedTemplateData?.name}</span>
            </p>
          </div>
          <Button onClick={handleBackToTemplates} variant="outline">
            ← Back to Templates
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="additional">Additional</TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  <TabsContent value="personal" className="space-y-6">
                    <PersonalDetailsForm
                      data={candidateInfo.personalDetails}
                      onChange={updatePersonalDetails}
                    />
                  </TabsContent>
                  
                  <TabsContent value="experience" className="space-y-6">
                    <ExperienceForm
                      data={candidateInfo.experience}
                      onChange={updateExperience}
                    />
                  </TabsContent>
                  
                  <TabsContent value="education" className="space-y-6">
                    <EducationForm
                      data={candidateInfo.education}
                      onChange={updateEducation}
                    />
                  </TabsContent>
                  
                  <TabsContent value="skills" className="space-y-6">
                    <SkillsForm
                      data={candidateInfo.skills}
                      onChange={updateSkills}
                    />
                  </TabsContent>
                  
                  <TabsContent value="additional" className="space-y-6">
                    <AdditionalDetailsForm
                      about={candidateInfo.about}
                      expectedSalary={candidateInfo.expectedSalary}
                      availableFrom={candidateInfo.availableFrom}
                      onAboutChange={(value) => setCandidateInfo(prev => ({ ...prev, about: value }))}
                      onSalaryChange={(value) => setCandidateInfo(prev => ({ ...prev, expectedSalary: value }))}
                      onAvailabilityChange={(value) => setCandidateInfo(prev => ({ ...prev, availableFrom: value }))}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>Candidate information summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage src={candidateInfo.personalDetails.profileImage} />
                  <AvatarFallback>
                    {candidateInfo.personalDetails.firstName?.[0]}
                    {candidateInfo.personalDetails.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">
                  {candidateInfo.personalDetails.firstName} {candidateInfo.personalDetails.lastName}
                </h3>
                <p className="text-sm text-gray-600">{candidateInfo.personalDetails.email}</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div><strong>Experience:</strong> {candidateInfo.experience.length} entries</div>
                <div><strong>Education:</strong> {candidateInfo.education.length} entries</div>
                <div><strong>Skills:</strong> {candidateInfo.skills.length} skills</div>
                <div><strong>Expected Salary:</strong> {candidateInfo.expectedSalary || 'Not specified'}</div>
                <div><strong>Available From:</strong> {candidateInfo.availableFrom || 'Not specified'}</div>
              </div>

              <Button className="w-full" size="lg" onClick={handleGenerateOffer}>
                Generate Offer Letter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function Templates() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <OfferLetterGenerator />
    </>
  );
}