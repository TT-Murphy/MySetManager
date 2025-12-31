# MySetManager 🏊‍♂️

A user-friendly web application for formatting swim practice sets. Transform your unstructured practice notes into professional, formatted workouts with automatic yardage calculation and time estimation.

## Features

- **Smart Text Parsing**: Handles various input formats for swim sets
- **Live Preview**: See formatted output as you type
- **Automatic Calculations**: Total yardage and estimated practice duration
- **Flexible Input**: Supports multiple interval notations ("on 1:00", "@1:00", "1:00")
- **PDF Export**: Save formatted practices as professional PDFs
- **Comment Support**: Include non-set instructions and notes
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd swimSetMaker
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Input Formats

The application recognizes various swim practice formats:

**Set Multipliers:**

- `3x` - Repeat the following set 3 times
- `2 rounds` - Perform 2 rounds of the set

**Exercise Format:**

- `4x50 Free fast 1:00` - 4 × 50 yards Freestyle fast on 1:00
- `1x200 IM easy @3:00` - 1 × 200 yards Individual Medley easy on 3:00

**Supported Strokes:**

- Free/Freestyle, Back/Backstroke, Breast/Breaststroke, Fly/Butterfly
- IM (Individual Medley), Drill, Kick, Choice

**Pace Indicators:**

- fast, easy, moderate, build, descend/desc

**Rest Periods:**

- `1 min rest` - 1 minute rest
- `Rest 2:00` - 2 minutes rest

### Example Input

```
Warm up - easy swimming
3x
1x200 Fr easy 3:00
4x50 drill 1:30
1 min rest

Main set - build speed
2x
8x25 Fr fast :30
2 min rest
```

### Example Output

```
Warm up - easy swimming

3x
    1 x 200 Free easy 3:00
    4 x 50 Drill 1:30
    Rest 1:00

Main set - build speed

2x
    8 x 25 Free fast 0:30
    Rest 2:00
```

## Development

### Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/auth/          # Authentication API endpoints
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── PracticeEditor.tsx # Main editing interface
│   └── Login.tsx         # Authentication component
├── lib/                  # Utility functions
│   └── parseSwimSet.ts   # Core parsing logic
└── types/                # TypeScript type definitions
    └── swimSet.ts        # Swimming set interfaces
```

### Key Components

- **PracticeEditor**: Main UI component with input/output panels
- **parseSwimSet**: Core parsing engine that handles text analysis
- **formatSwimSet**: Converts parsed data to formatted output

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Future Enhancements

- [ ] User authentication and saved practices
- [ ] Practice templates and sharing
- [ ] Advanced timing calculations
- [ ] Team management features
- [ ] Mobile app version

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions or suggestions, please open an issue on GitHub.
