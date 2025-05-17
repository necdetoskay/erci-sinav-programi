import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

describe('Card Component', () => {
  test('renders Card with children', () => {
    render(
      <Card>
        <div data-testid="card-child">Card Content</div>
      </Card>
    );
    
    expect(screen.getByTestId('card-child')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  test('renders Card with custom className', () => {
    render(
      <Card className="custom-class">
        <div>Card Content</div>
      </Card>
    );
    
    const card = screen.getByText('Card Content').parentElement;
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('border');
  });

  test('renders CardHeader correctly', () => {
    render(
      <Card>
        <CardHeader data-testid="card-header">
          <div>Header Content</div>
        </CardHeader>
      </Card>
    );
    
    const header = screen.getByTestId('card-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('p-6');
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('flex-col');
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  test('renders CardTitle correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle data-testid="card-title">Card Title</CardTitle>
        </CardHeader>
      </Card>
    );
    
    const title = screen.getByTestId('card-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-2xl');
    expect(title).toHaveClass('font-semibold');
    expect(title.tagName).toBe('H3'); // CardTitle should render as h3
  });

  test('renders CardDescription correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription data-testid="card-description">Card Description</CardDescription>
        </CardHeader>
      </Card>
    );
    
    const description = screen.getByTestId('card-description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm');
    expect(description).toHaveClass('text-muted-foreground');
    expect(description.tagName).toBe('P'); // CardDescription should render as p
  });

  test('renders CardContent correctly', () => {
    render(
      <Card>
        <CardContent data-testid="card-content">
          <div>Content</div>
        </CardContent>
      </Card>
    );
    
    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('p-6');
    expect(content).toHaveClass('pt-0');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('renders CardFooter correctly', () => {
    render(
      <Card>
        <CardFooter data-testid="card-footer">
          <div>Footer Content</div>
        </CardFooter>
      </Card>
    );
    
    const footer = screen.getByTestId('card-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('p-6');
    expect(footer).toHaveClass('pt-0');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  test('renders full card with all components', () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Example Card</CardTitle>
          <CardDescription>This is a description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content</p>
        </CardContent>
        <CardFooter>
          <button>Action Button</button>
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByTestId('full-card')).toBeInTheDocument();
    expect(screen.getByText('Example Card')).toBeInTheDocument();
    expect(screen.getByText('This is a description')).toBeInTheDocument();
    expect(screen.getByText('This is the main content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });
});
