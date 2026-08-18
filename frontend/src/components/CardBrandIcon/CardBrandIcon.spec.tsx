import { render, screen } from '@testing-library/react';
import CardBrandIcon from './CardBrandIcon';

describe('CardBrandIcon', () => {
  it('renders the Visa mark', () => {
    render(<CardBrandIcon brand="visa" />);
    expect(screen.getByTestId('card-brand-visa')).toBeInTheDocument();
  });

  it('renders the Mastercard mark', () => {
    render(<CardBrandIcon brand="mastercard" />);
    expect(screen.getByTestId('card-brand-mastercard')).toBeInTheDocument();
  });

  it('renders nothing for an unknown brand', () => {
    const { container } = render(<CardBrandIcon brand="unknown" />);
    expect(container).toBeEmptyDOMElement();
  });
});
