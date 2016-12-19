;(function()
{
    var tokenRegex = /;(.+)|[^\s"']+|"([^"]*)"|'([^']*)'/g;

    var TokenOpCode = 'opcode';
    var TokenRegister = 'register';
    var TokenPointer = 'pointer';
    var TokenInt = 'int';
    var TokenString = 'string';
    var TokenLabel = 'label';
    var TokenComment = 'comment';

    var availableOpCodes = {};

    var opCodeMappings = {};
    function createKey(opcodeName, types)
    {
        return opcodeName + '-' + types.join('-');
    }
    function setMapping(opcode, opcodeName)
    {
        var types = Array.prototype.slice.call(arguments, 2);

        availableOpCodes[opcodeName] = true;
        var key = createKey(opcodeName, types);
        opCodeMappings[key] = opcode;
    }
    function getMapping(opcodeName, types)
    {
        var key = createKey(opcodeName, types)
        var result = opCodeMappings[key];
        if (!result)
        {
            throw new Error('Unknown opcode mapping: ', opcodeName, types);
        }
        return result;
    }

    function Token(type, value)
    {
        this.type = type;
        this.value = value;
    }

    function LineResult(bytes, label, labelIndex)
    {
        this.bytes = bytes;
        this.label = label;
        this.labelIndex = labelIndex;
    }

    function Assembler()
    {
        this.labels = {};
        this.labelBytePositions = {};
        this.labelReplaceLocations = {};
        this.processedLines = [];
        this.resultBuilder = [];
        this.finalResult = null;
    }

    Assembler.init = function()
    {
        var code = simpleCpu.opCodes;
        setMapping(code.moveRI, 'mov', TokenRegister, TokenInt);
        setMapping(code.moveRR, 'mov', TokenRegister, TokenRegister);
        
        setMapping(code.moveRP, 'mov', TokenRegister, TokenPointer);
        setMapping(code.movePR, 'mov', TokenPointer, TokenRegister);
        
        setMapping(code.addRI, 'add', TokenRegister, TokenInt);
        setMapping(code.addRR, 'add', TokenRegister, TokenRegister);

        setMapping(code.compareRI, 'cmp', TokenRegister, TokenInt);
        setMapping(code.compareRR, 'cmp', TokenRegister, TokenRegister);
        
        setMapping(code.jumpL, 'jmp', TokenLabel);
        setMapping(code.jumpEqualsL, 'jeq', TokenLabel);
        setMapping(code.jumpNotEqualsL, 'jneq', TokenLabel);
        setMapping(code.jumpLessThanL, 'jlt', TokenLabel);
        setMapping(code.jumpLessThanEqualL, 'jlte', TokenLabel);
        setMapping(code.jumpGreaterThanL, 'jgt', TokenLabel);
        setMapping(code.jumpGreaterThanEqualL, 'jgte', TokenLabel);

        console.log('Mappings', opCodeMappings);
    }

    var fn = Assembler.prototype;

    fn.assemble = function(input)
    {
        this.processInputLines(input);
        this.assembleTokens();
        this.combineResult();
        this.postProcessLabels();

        console.log('Final: ', this.finalResult);
        return this.finalResult;
    }

    fn.processInputLines = function(input)
    {
        var split = input.split('\n');
        for (var i = 0; i < split.length; i++)
        {
            this.processLine(split[i], i);
        }
    }

    fn.processLine = function(line, lineNumber)
    {
        var trimmedLine = line.trim();
        if (trimmedLine.length === 0)
        {
            this.processedLines.push(null);
            return;
        }

        var tokens = trimmedLine.match(tokenRegex);
        console.log('Split tokens [', lineNumber, ']: ', tokens);

        var processedLine = [];
        for (var i = 0; i < tokens.length; i++)
        {
            processedLine.push(this.processToken(tokens[i], i === 0));
        }
        console.log('Tokens [', lineNumber, ']', processedLine);
        this.processedLines.push(processedLine)
    }

    fn.processToken = function(token, isFirstToken)
    {
        var lowerToken = token.toLowerCase();
        var hasOpCode = availableOpCodes[lowerToken];
        if (hasOpCode === true)
        {
            return new Token(TokenOpCode, lowerToken);
        }

        // eg: r0, r10
        if (lowerToken[0] === 'r')
        {
            return new Token(TokenRegister, parseInt(lowerToken.substr(1)));
        }
        // eg: @r2, @r13
        if (lowerToken[0] === '@' && lowerToken[1] === 'r')
        {
            return new Token(TokenPointer, parseInt(lowerToken.substr(2)));
        }
        // eg: mov r0 5 ; This is a comment
        if (lowerToken[0] === ';')
        {
            return new Token(TokenComment, token);
        }
        // eg: start:, jmp start:
        if (token[token.length - 1] === ':')
        {
            return new Token(TokenLabel, token);
        }

        if (isFirstToken)
        {
            throw new Error('Unknown opcode: ' + token);
        }
        return new Token(TokenInt, parseInt(lowerToken));
    }

    fn.assembleTokens = function()
    {
        for (var i = 0; i < this.processedLines.length; i++)
        {
            var line = this.processedLines[i];
            if (line == null)
            {
                continue;
            }

            var assembledLine = this.assembleTokenLine(line);
            if (assembledLine === null)
            {
                continue;
            }

            this.resultBuilder.push(assembledLine);
        }

        console.log("Result builder", this.resultBuilder, this.labels);
    }

    fn.combineResult = function()
    {
        var totalBytes = 0;
        for (var i = 0; i < this.resultBuilder.length; i++)
        {
            totalBytes += this.resultBuilder[i].bytes.length; 
        }

        this.finalResult = new Int8Array(totalBytes);
        var pos = 0;
        for (var i = 0; i < this.resultBuilder.length; i++)
        {
            if (this.labels[i])
            {
                this.labelBytePositions[this.labels[i]] = pos;
            }

            var resultLine = this.resultBuilder[i];
            if (resultLine.label)
            {
                this.addLabelReplaceLocation(resultLine.label, resultLine.labelIndex + pos);
            }

            var bytes = resultLine.bytes;
            for (var j = 0; j < bytes.length; j++)
            {
                this.finalResult[pos++] = bytes[j];
            }
        }

        console.log(this.labelBytePositions, this.labelReplaceLocations);
    }

    fn.addLabelReplaceLocation = function(label, index)
    {
        var locations = this.labelReplaceLocations[label];
        if (!locations)
        {
            locations = this.labelReplaceLocations[label] = [];
        }
        locations.push(index);
    }

    fn.postProcessLabels = function()
    {
        for (var label in this.labelReplaceLocations)
        {
            var labelIndex = this.labelBytePositions[label];
            var replaceIndices = this.labelReplaceLocations[label];

            for (var i = 0; i < replaceIndices.length; i++)
            {
                writeInt32(this.finalResult, replaceIndices[i], labelIndex);
            }
        }
    }

    fn.assembleTokenLine = function(line)
    {
        var type = line[0].type;
        if (type === TokenLabel)
        {
            //this.labels[line[0].value] = this.resultBuilder.length;
            this.labels[this.resultBuilder.length] = line[0].value;
            return null;
        }
        else if (type !== TokenOpCode)
        {
            throw new Error('Unexpected token: ' + type + ' = ' + line[0].value);
        }

        // Will be an opcode at this point
        return this.writeLineToArray(line);
    }

    fn.writeLineToArray = function(line)
    {
        var opcodeToken = line[0];
        var lineTypes = this.getTypesFromLine(line);

        var opcode = getMapping(opcodeToken.value, lineTypes);
        console.log('Opcode mapping: ', opcode, opcodeToken.value, lineTypes)

        var byteCount = this.countBytesRequired(lineTypes);
        // Plus one for opcode.
        byteCount += 1;

        var resultBytes = new Int8Array(byteCount);

        var labelFound = null;
        var labelIndex = -1;

        var position = writeInt8(resultBytes, 0, opcode);

        for (var i = 0; i < line.length; i++)
        {
            var token = line[i];
            var type = token.type;
            switch (type)
            {
                default:
                case TokenOpCode:
                    break;

                case TokenRegister:
                case TokenPointer:
                    position = writeInt8(resultBytes, position, token.value);
                    break;

                case TokenLabel:
                    labelFound = token.value;
                    labelIndex = position;
                    position = writeInt32(resultBytes, position, 0);
                    break;

                case TokenInt:
                    position = writeInt32(resultBytes, position, token.value);
                    break;
            }
        }
        return new LineResult(resultBytes, labelFound, labelIndex);
    }
    fn.countBytesRequired = function(lineTypes)
    {
        var result = 0;
        for (var i = 0; i < lineTypes.length; i++)
        {
            var type = lineTypes[i];
            if (type === TokenInt ||
                type === TokenLabel)
            {
                result += 4;
            }
            else if (type === TokenRegister ||
                type === TokenPointer)
            {
                result += 1;
            }
        }

        return result;
    }
    fn.getTypesFromLine = function(line)
    {
        var result = [];
        for (var i = 0; i < line.length; i++)
        {
            var token = line[i];
            if (token.type === TokenOpCode || 
                token.type === TokenComment)
            {
                continue;
            }
            result.push(token.type);
        }
        return result;
    }

    function writeInt8(array, index, value)
    {
        array[index] = value;
        return index + 1;
    }
    function writeInt16(array, index, value)
    {
        array[index] = (value >> 8) & 0xFF;
        array[index + 1] = value & 0xFF;
        return index + 2;
    }
    function writeInt32(array, index, value)
    {
        array[index] = value & 0xFF;
        array[index + 1] = (value >> 8) & 0xFF;
        array[index + 2] = (value >> 16) & 0xFF;
        array[index + 3] = (value >> 24) & 0xFF;
        return index + 4;
    }

    window.simpleCpuAssembler = Assembler;

})();
