;(function()
{
    'use strict';

    let cpu = null;
    let textWidth = 0;
    let textHeight = 0;

    function init()
    {
        simpleCpuAssembler.init();
        
        cpu = new simpleCpu();
        cpu.init(2, 8, 8, 16);

        $('.js-texteditor').on('change', onTextChange);

        let initialText = localStorage.getItem('textEditor');
        console.log('Initial:', initialText);
        if (initialText)
        {
            document.querySelector('.js-texteditor').value = initialText;
        }

        $('.js-run').on('click', onRunClick);
        $('.js-assemble').on('click', onAssembleClick);
        $('.js-one-step').on('click', onOneStepClick);
        $('.js-reset').on('click', onResetClick);

        let $testText = $('.js-input');
        textWidth = $testText.width();
        textHeight = $testText.height();
        console.log('Size: ', textWidth, textHeight);
        $testText.removeClass('test-text').text('');
    }

    function onTextChange(e)
    {
        localStorage.setItem('textEditor', e.target.value);
    }

    function onAssembleClick()
    {
        let assembler = new simpleCpuAssembler();
        let code = document.querySelector('.js-texteditor').value;
        let instructions = assembler.assemble(code);

        cpu.setInstructions(instructions);
        $('.js-input').html(getInputDisplay());
    }

    function onRunClick()
    {
        cpu.execute();
        updateDisplay();
    }

    function onOneStepClick()
    {
        cpu.oneStep();
        updateDisplay();
    }

    function onResetClick()
    {
        cpu.reset();
        updateDisplay();
    }

    function updateDisplay()
    {
        $('.js-registers').html(getRegisterDisplay());
        $('.js-memory').html(getMemoryDisplay());
        $('.js-program-counter').text(cpu.getProgramCounter());

        let pos = calcProgramCounterTextPosition();
        let posOffset = calcProgramCounterTextPositionOffset();
        $('.js-input').css('top', pos);
        $('.js-input-line').css('top', posOffset);
    }

    function calcProgramCounterTextPositionOffset()
    {
        return textHeight * 5;
    }
    function calcProgramCounterTextPosition()
    {
        return -textHeight * (cpu.getProgramCounter()) + calcProgramCounterTextPositionOffset();
    }

    function getInputDisplay()
    {
        let input = cpu.getInstructions();
        let result = '';
        let pc = cpu.getProgramCounter();

        //let start = Math.max(pc - 10, 0);
        //let end = Math.min(pc + 10, input.length);
        let start = 0;
        let end = input.length;
        for (let i = start; i < end; i++)
        {
            result += i + ': ' + formatHex(input[i]);
            if (i === pc)
            {
                //result += ' <-- PC';
            }
            result += '<br/>';
        }
        if (pc >= input.length)
        {
            //result += '<-- PC at end';
        }
        return result;
    }

    function formatHex(input)
    {
        if (input < 16)
        {
            return '0' + input.toString(16);
        }
        return input.toString(16);
    }

    function getRegisterDisplay()
    {
        let registers = cpu.registers;
        let result = '';
        for (let i = 0; i < registers.length; i++)
        {
            result += i + ' = ' + registers[i] + '<br/>';
        }
        return result;
    }

    function getMemoryDisplay()
    {
        let memory = cpu.memory;
        let result = '';

        for (let i = 0; i < memory.length; i++)
        {
            result += 'Bank ' + i + '<br/>';

            let bank = memory[i];
            for (let j = 0; j < bank.length; j++)
            {
                result += j + ' = ' + bank[j] + '<br/>';
            }
            result += '<br/>';
        }

        return result;
    }

    $(init);

})();
