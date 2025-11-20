/**
 * Metadata Editor Form Fields
 */

'use client';

import { useState } from 'react';
import { Input } from '@workspace/ui/components/ui/input';
import { Textarea } from '@workspace/ui/components/ui/textarea';
import { Label } from '@workspace/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';
import { Badge } from '@workspace/ui/components/ui/badge';
import { X } from 'lucide-react';
import { useMetadataEditorContext } from '../core/metadata-editor.context';
import { imageCategoryEnum } from '@/db/schemas/image-app-space-schema';

export function TitleInput() {
  const { title, setTitle, errors } = useMetadataEditorContext();

  return (
    <div className="space-y-2">
      <Label htmlFor="title">Title</Label>
      <Input
        id="title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Enter image title..."
        maxLength={200}
      />
      {errors.title && (
        <p className="text-sm text-destructive">{errors.title}</p>
      )}
    </div>
  );
}

export function DescriptionTextarea() {
  const { description, setDescription, errors } = useMetadataEditorContext();

  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Describe your image..."
        rows={4}
        maxLength={1000}
      />
      {errors.description && (
        <p className="text-sm text-destructive">{errors.description}</p>
      )}
    </div>
  );
}

export function TagsInput() {
  const { tags, setTags, errors } = useMetadataEditorContext();
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    if (!inputValue.trim()) return;
    if (tags.length >= 10) return;
    if (!tags.includes(inputValue.trim())) {
      setTags([...tags, inputValue.trim()]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="tags">Tags (max 10)</Label>
      <div className="flex gap-2">
        <Input
          id="tags"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag and press Enter..."
          disabled={tags.length >= 10}
        />
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{tags.length}/10 tags</p>
      {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
    </div>
  );
}

export function CategorySelect() {
  const { category, setCategory } = useMetadataEditorContext();

  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select
        value={category || 'none'}
        onValueChange={value =>
          setCategory(value === 'none' ? undefined : (value as any))
        }
      >
        <SelectTrigger id="category">
          <SelectValue placeholder="Select category..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {imageCategoryEnum.enumValues.map(cat => (
            <SelectItem key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
